"use client"

import * as React from "react"
import NextImage from "next/image"
import { FileText, Upload, X } from "lucide-react"
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn, formatBytes } from "@/lib/utils"
import { useControllableState } from "@/hooks/use-controllable-state"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Maximize, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { useTranslation } from "next-i18next"

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value of the uploader.
   * @type File[]
   * @default undefined
   * @example value={files}
   */
  value?: File[]

  /**
   * Function to be called when the value changes.
   * @type (files: File[]) => void
   * @default undefined
   * @example onValueChange={(files) => setFiles(files)}
   */
  onValueChange?: (files: File[]) => void

  /**
   * Function to be called when files are uploaded.
   * @type (files: File[]) => Promise<void>
   * @default undefined
   * @example onUpload={(files) => uploadFiles(files)}
   */
  onUpload?: (files: File[]) => Promise<void>

  /**
   * Progress of the uploaded files.
   * @type Record<string, number> | undefined
   * @default undefined
   * @example progresses={{ "file1.png": 50 }}
   */
  progresses?: Record<string, number>

  /**
   * Accepted file types for the uploader.
   * @type { [key: string]: string[]}
   * @default
   * ```ts
   * { "image/*": [] }
   * ```
   * @example accept={["image/png", "image/jpeg"]}
   */
  accept?: DropzoneProps["accept"]

  /**
   * Maximum number of files for the uploader.
   * @type number | undefined
   * @default 1
   * @example maxFileCount={4}
   */
  maxFileCount?: DropzoneProps["maxFiles"]

  /**
   * Whether the uploader should accept multiple files.
   * @type boolean
   * @default false
   * @example multiple
   */
  multiple?: boolean

  /**
   * Whether the uploader is disabled.
   * @type boolean
   * @default false
   * @example disabled
   */
  disabled?: boolean

  /**
   * Whether a file must be selected. Forwarded to the hidden file input.
   */
  required?: boolean
}

interface CropDialogProps {
  file: File | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (croppedFile: File) => void
}

/**
 * Deliberately matched to the downscale the upload step applies. Emitting
 * upload-ready output means the crop is the only lossy pass: the resize step
 * finds the image already within bounds and passes it through untouched,
 * instead of decoding and re-encoding a large JPEG a second time.
 *
 * It also keeps us clear of the per-browser canvas caps (iOS Safari allows
 * roughly 16.7M pixels and 4096px per side, past which `toBlob` returns null).
 */
const MAX_OUTPUT_DIMENSION = 1800
const OUTPUT_QUALITY = 0.8

/**
 * A rotate is a full-resolution canvas op, same as the crop, so it needs the
 * same per-browser cap (iOS Safari: ~16.7M pixels, 4096px per side). Kept well
 * above MAX_OUTPUT_DIMENSION on purpose: rotating shouldn't throw away detail
 * a later, smaller crop selection might still want.
 */
const MAX_ROTATE_DIMENSION = 4096

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function CropDialog({
  file,
  isOpen,
  onOpenChange,
  onCropComplete,
}: CropDialogProps) {
  const { t } = useTranslation("common")
  const [crop, setCrop] = React.useState<Crop>()
  const [imgSrc, setImgSrc] = React.useState("")
  const imgRef = React.useRef<HTMLImageElement>(null)

  // Rotation replaces `imgSrc` with a freshly rendered object URL, so the URL
  // actually on screen has to be tracked separately from the file: it may no
  // longer be the one the file effect created.
  const currentUrlRef = React.useRef<string | null>(null)
  const showImage = React.useCallback((url: string) => {
    if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
    currentUrlRef.current = url
    setImgSrc(url)
  }, [])

  React.useEffect(() => {
    if (!file) return

    // The dialog is not unmounted between files, so clear the previous
    // selection rather than briefly applying it to the new image.
    setCrop(undefined)
    showImage(URL.createObjectURL(file))

    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current)
        currentUrlRef.current = null
      }
    }
  }, [file, showImage])

  function onImageLoad() {
    // Percent units are independent of the rendered size, so the whole image is
    // a safe default regardless of how it ends up laid out. Receipts are usually
    // tall, and the old 16:9 default threw most of them away before the user
    // touched anything.
    setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 })
  }

  // Bakes the turn into the actual pixels rather than a CSS transform, so the
  // crop below keeps mapping percentages onto natural width/height exactly as
  // it already does — no separate coordinate space to account for rotation in.
  async function rotateImage() {
    const image = imgRef.current
    if (!image) return

    const scale = Math.min(
      1,
      MAX_ROTATE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    )
    const drawWidth = Math.round(image.naturalWidth * scale)
    const drawHeight = Math.round(image.naturalHeight * scale)

    const canvas = document.createElement("canvas")
    canvas.width = drawHeight
    canvas.height = drawWidth

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(Math.PI / 2)
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

    // PNG, not JPEG: this is a working copy that may be rotated several times
    // before the user is done, and JPEG would compound generation loss on
    // every turn. The final crop below is still the one lossy encode.
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png")
    })
    if (!blob) return

    // The image's dimensions just changed, so any existing selection is
    // meaningless against it — reset rather than remap.
    setCrop(undefined)
    showImage(URL.createObjectURL(blob))
  }

  async function cropImage() {
    if (!file) return

    const image = imgRef.current
    if (!image) return

    // Nothing meaningful selected — pass the original through untouched.
    if (!crop || crop.width <= 0 || crop.height <= 0) {
      onCropComplete(file)
      return
    }

    const { naturalWidth, naturalHeight } = image

    // A percent crop is relative to the rendered image, which makes it directly
    // proportional to the natural size. Going through the rendered pixel size
    // instead skews the result whenever the rendered box aspect drifts from the
    // natural one — `image.width`/`image.height` are integers, so tall images
    // amplify that rounding into a visibly wrong vertical offset.
    const sx = clamp((crop.x / 100) * naturalWidth, 0, naturalWidth)
    const sy = clamp((crop.y / 100) * naturalHeight, 0, naturalHeight)
    const sWidth = clamp(
      (crop.width / 100) * naturalWidth,
      1,
      naturalWidth - sx,
    )
    const sHeight = clamp(
      (crop.height / 100) * naturalHeight,
      1,
      naturalHeight - sy,
    )

    // Never upscales — a small selection stays its own size.
    const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(sWidth, sHeight))

    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(sWidth * scale))
    canvas.height = Math.max(1, Math.round(sHeight * scale))

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      onCropComplete(file)
      return
    }

    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(
      image,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", OUTPUT_QUALITY)
    })

    // toBlob can still fail (memory pressure, tainted canvas). Fall back to the
    // original file rather than silently dropping the receipt.
    //
    // Closing is left to the parent, which owns the selected file.
    onCropComplete(
      blob ? new File([blob], file.name, { type: "image/jpeg" }) : file,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("fileUploader.crop.title")}</DialogTitle>
          {/*
            Radix warns when a DialogContent has no description. Kept sr-only so
            the height-constrained layout is unchanged.
          */}
          <DialogDescription className="sr-only">
            {t("fileUploader.crop.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative min-h-0 w-full flex-1 overflow-hidden">
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={4}
            centerOnInit
            panning={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(_crop: Crop, percentCrop: Crop) =>
                      setCrop(percentCrop)
                    }
                    /*
                      The height cap belongs here, not on the <img>: ReactCrop's
                      own `.ReactCrop__child-wrapper > img { max-height: inherit }`
                      outranks any class on the image, so it has to cascade down
                      from this element. It also has to be a *definite* length —
                      `max-h-full` resolves against an auto-height wrapper, so it
                      is dropped and a tall image renders at full natural height,
                      overflowing into `overflow: hidden` with most of the crop
                      area scrolled out of reach.
                    */
                    className="flex max-h-[60vh] max-w-full items-center justify-center"
                  >
                    {/*
                      A raw <img> is required here, not next/image: the crop
                      reads naturalWidth/naturalHeight off this element and draws
                      it to a canvas, and the source is a local object URL that
                      the image optimiser cannot fetch anyway.
                    */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt={t("fileUploader.crop.imageAlt")}
                      onLoad={onImageLoad}
                      className="h-auto w-auto object-contain"
                    />
                  </ReactCrop>
                </TransformComponent>
                <div className="bg-background/80 absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => {
                      // The rotated image is a different size, so the old
                      // zoom/pan no longer frames it usefully.
                      void rotateImage().then(() => resetTransform())
                    }}
                  >
                    <RotateCw className="size-4" />
                    <span className="sr-only">
                      {t("fileUploader.crop.rotate")}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => zoomOut()}
                  >
                    <ZoomOut className="size-4" />
                    <span className="sr-only">
                      {t("fileUploader.crop.zoomOut")}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => resetTransform()}
                  >
                    <Maximize className="size-4" />
                    <span className="sr-only">
                      {t("fileUploader.crop.resetZoom")}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => zoomIn()}
                  >
                    <ZoomIn className="size-4" />
                    <span className="sr-only">
                      {t("fileUploader.crop.zoomIn")}
                    </span>
                  </Button>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("fileUploader.crop.cancel")}
          </Button>
          <Button onClick={cropImage}>{t("fileUploader.crop.confirm")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Forwards a ref because it is rendered inside shadcn's `FormControl`, which
 * clones it through a Radix `Slot`, and react-hook-form spreads `field.ref` onto
 * it as well. Without this, React drops both refs and warns.
 */
export const FileUploader = React.forwardRef<HTMLDivElement, FileUploaderProps>(
  function FileUploader(props, ref) {
    const {
      value: valueProp,
      onValueChange,
      onUpload,
      progresses,
      accept = {
        "image/*": [],
      },
      maxFileCount = 1,
      multiple = false,
      disabled = false,
      required = false,
      className,
      ...dropzoneProps
    } = props

    const { t } = useTranslation("common")

    const [files, setFiles] = useControllableState({
      prop: valueProp,
      onChange: onValueChange,
    })

    const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

    const [cropDialogFile, setCropDialogFile] = React.useState<File | null>(
      null,
    )

    const addFiles = React.useCallback(
      async (newFiles: File[]) => {
        if (newFiles.length === 0) return

        const updatedFiles = files ? [...files, ...newFiles] : newFiles

        setFiles(updatedFiles)

        if (onUpload && updatedFiles.length <= maxFileCount) {
          try {
            await onUpload(updatedFiles)
          } catch (error) {
            console.error("Upload failed:", error)
          }
        }
      },
      [files, maxFileCount, onUpload, setFiles],
    )

    const onDrop = React.useCallback(
      async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        // Reported before any early return below, so a rejection is never hidden
        // by the crop dialog opening for an accepted file in the same drop.
        setErrorMessage(
          rejectedFiles.length > 0
            ? t("fileUploader.errors.fileRejected", {
                fileName: rejectedFiles.map(({ file }) => file.name).join(", "),
              })
            : null,
        )

        if (acceptedFiles.length === 0) return

        if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
          setErrorMessage(t("fileUploader.errors.singleFile"))
          return
        }

        if ((files?.length ?? 0) + acceptedFiles.length > maxFileCount) {
          setErrorMessage(
            t("fileUploader.errors.maxFiles", { count: maxFileCount }),
          )
          return
        }

        // An image goes through the crop dialog first; anything else is taken as
        // is. Only the first file is ever an image here, because the dropzone is
        // single-file: it rejects a multi-file drop before we see it.
        const [first] = acceptedFiles
        if (first?.type.startsWith("image/")) {
          setCropDialogFile(first)
          return
        }

        await addFiles(acceptedFiles)
      },
      [addFiles, files, maxFileCount, multiple, t],
    )

    function onRemove(index: number) {
      if (!files) return

      const newFiles = files.filter((_, i) => i !== index)

      setFiles(newFiles)
      onValueChange?.(newFiles)
    }

    const isDisabled = disabled || (files?.length ?? 0) >= maxFileCount

    const handleCropComplete = (croppedFile: File) => {
      void addFiles([croppedFile])
      setCropDialogFile(null)
    }

    return (
      <div ref={ref} className="relative flex flex-col gap-3 overflow-hidden">
        {!isDisabled && (
          <Dropzone
            onDrop={onDrop}
            accept={accept}
            maxFiles={maxFileCount}
            multiple={maxFileCount > 1 || multiple}
            disabled={isDisabled}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                className={cn(
                  "border-muted-foreground/25 group relative grid h-32 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-4 py-2 text-center transition hover:bg-muted/25",
                  "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  isDragActive && "border-muted-foreground/50",
                  isDisabled && "pointer-events-none opacity-60",
                  className,
                )}
                {...dropzoneProps}
                aria-required={required || undefined}
              >
                <input {...getInputProps({ required })} />
                {isDragActive ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("fileUploader.dropHere")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Upload
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("fileUploader.clickOrDrag")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Dropzone>
        )}
        {errorMessage ? (
          <p className="text-destructive text-xs">{errorMessage}</p>
        ) : null}
        {files?.length ? (
          <div className="flex flex-col gap-2.5">
            {files?.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                onRemove={() => onRemove(index)}
                progress={progresses?.[file.name]}
              />
            ))}
          </div>
        ) : null}
        <CropDialog
          file={cropDialogFile}
          isOpen={!!cropDialogFile}
          onOpenChange={(open) => !open && setCropDialogFile(null)}
          onCropComplete={handleCropComplete}
        />
      </div>
    )
  },
)

interface FileCardProps {
  file: File
  onRemove: () => void
  progress?: number
}

function FileCard({ file, progress, onRemove }: FileCardProps) {
  const { t } = useTranslation("common")

  return (
    <div className="bg-card hover:bg-accent/50 group relative flex items-center gap-2.5 rounded-md border p-2 transition-colors">
      <div className="relative shrink-0">
        {file.type.startsWith("image/") || file.type === "application/pdf" ? (
          <FilePreview file={file} />
        ) : (
          <div className="relative flex aspect-square size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            <FileText
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -right-1 -top-1 size-5 rounded-full opacity-100 shadow-md transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="size-2.5" aria-hidden="true" />
          <span className="sr-only">{t("fileUploader.card.removeFile")}</span>
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-col gap-0.5">
          <p className="text-foreground line-clamp-1 text-xs font-medium">
            {file.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatBytes(file.size)}
          </p>
        </div>
        {progress !== undefined && (
          <Progress value={progress} className="h-1" />
        )}
      </div>
    </div>
  )
}

interface FilePreviewProps {
  file: File
}

function FilePreview({ file }: FilePreviewProps) {
  const [preview, setPreview] = React.useState<string>("")
  const [isPdfOpen, setIsPdfOpen] = React.useState(false)
  const [isImageOpen, setIsImageOpen] = React.useState(false)
  const { t } = useTranslation("common")

  React.useEffect(() => {
    // Create preview URL when component mounts
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Cleanup preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (file.type.startsWith("image/")) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsImageOpen(true)}
          className="relative aspect-square size-14 shrink-0 overflow-hidden rounded-md border transition-opacity hover:opacity-90"
        >
          <NextImage
            src={preview}
            alt={file.name}
            width={56}
            height={56}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </button>

        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
          <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{file.name}</DialogTitle>
              <DialogDescription className="sr-only">
                {t("fileUploader.preview.imageDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="relative flex min-h-[20vh] w-full flex-1 items-center justify-center overflow-hidden">
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={4}
                centerOnInit
                wheel={{ wheelDisabled: false }}
                doubleClick={{
                  mode: "toggle",
                  step: 2,
                }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      {/*
                        Definite cap, for the same reason as the crop dialog:
                        the dialog only sets `max-h-[90vh]`, and a max-height
                        does not make a height definite, so `max-h-full` here
                        resolved against an indefinite parent and was dropped —
                        leaving a tall receipt at natural height, clipped by
                        `overflow: hidden` with only its top visible.
                      */}
                      <NextImage
                        src={preview}
                        alt={file.name}
                        width={1200}
                        height={800}
                        className="h-auto max-h-[70vh] w-auto max-w-full object-contain"
                        loading="lazy"
                        unoptimized
                      />
                    </TransformComponent>
                    <div className="bg-background/80 absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => zoomOut()}
                      >
                        <ZoomOut className="size-4" />
                        <span className="sr-only">
                          {t("fileUploader.crop.zoomOut")}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => resetTransform()}
                      >
                        <Maximize className="size-4" />
                        <span className="sr-only">
                          {t("fileUploader.crop.resetZoom")}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => zoomIn()}
                      >
                        <ZoomIn className="size-4" />
                        <span className="sr-only">
                          {t("fileUploader.crop.zoomIn")}
                        </span>
                      </Button>
                    </div>
                  </>
                )}
              </TransformWrapper>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (file.type === "application/pdf") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsPdfOpen(true)}
          className="relative aspect-square size-14 shrink-0 overflow-hidden rounded-md border bg-muted transition-opacity hover:opacity-90"
        >
          <iframe
            src={preview}
            title={file.name}
            className="h-full w-full"
            style={{ border: "none", pointerEvents: "none" }}
          />
        </button>

        <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
          <DialogContent className="flex h-[80vh] max-w-4xl flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{file.name}</DialogTitle>
              <DialogDescription className="sr-only">
                {t("fileUploader.preview.pdfDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 w-full flex-1 overflow-hidden">
              <iframe
                src={preview}
                title={file.name}
                className="h-full w-full"
                style={{ border: "none" }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
  )
}
