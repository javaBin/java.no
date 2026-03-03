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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn, formatBytes } from "@/lib/utils"
import { useControllableState } from "@/hooks/use-controllable-state"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ZoomIn, ZoomOut } from "lucide-react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop"
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
   * Maximum file size for the uploader.
   * @type number | undefined
   * @default 1024 * 1024 * 2 // 2MB
   * @example maxSize={1024 * 1024 * 2} // 2MB
   */
  maxSize?: DropzoneProps["maxSize"]

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
}

interface CropDialogProps {
  file: File | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (croppedFile: File) => void
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

  React.useEffect(() => {
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setImgSrc(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        16 / 9,
        width,
        height,
      ),
      width,
      height,
    )
    setCrop(crop)
  }

  async function cropImage() {
    if (!file) return

    if (!imgRef.current || !crop) return
    if (crop?.width === 0 || crop?.height === 0) {
      onCropComplete(file)
      onOpenChange(false)
      return
    }

    const image = imgRef.current
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get the scaling factor between displayed size and natural size
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Calculate the actual dimensions of the displayed image
    const displayedWidth = image.width
    const displayedHeight =
      (image.naturalHeight / image.naturalWidth) * displayedWidth

    // Convert percentage values to pixels based on the displayed dimensions
    const pixelCrop = {
      x: (crop.x * displayedWidth) / 100,
      y: (crop.y * displayedHeight) / 100,
      width: (crop.width * displayedWidth) / 100,
      height: (crop.height * displayedHeight) / 100,
    }

    // Set canvas dimensions to the actual crop size in natural image coordinates
    canvas.width = pixelCrop.width * scaleX
    canvas.height = pixelCrop.height * scaleY

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
        },
        "image/jpeg",
        0.95,
      )
    })

    // Create new file from blob
    const croppedFile = new File([blob], file.name, {
      type: "image/jpeg",
    })

    onCropComplete(croppedFile)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("fileUploader.crop.title")}</DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 min-h-[20vh] w-full overflow-hidden">
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
                    className="flex max-h-full max-w-full items-center justify-center"
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt={t("fileUploader.crop.imageAlt")}
                      onLoad={onImageLoad}
                      className="max-h-full max-w-full w-auto h-auto object-contain"
                    />
                  </ReactCrop>
                </TransformComponent>
                <div className="bg-background/80 absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur z-10">
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
                    <NextImage
                      src={imgSrc}
                      alt={t("fileUploader.crop.resetZoomAlt")}
                      width={16}
                      height={16}
                      className="size-4 object-cover"
                    />
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
        <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("fileUploader.crop.cancel")}
          </Button>
          <Button onClick={cropImage}>
            {t("fileUploader.crop.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FileUploader(props: FileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    progresses,
    accept = {
      "image/*": [],
    },
    maxSize = 1024 * 1024 * 2,
    maxFileCount = 1,
    multiple = false,
    disabled = false,
    className,
    ...dropzoneProps
  } = props

  const { t } = useTranslation("common")

  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
  })

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [cropDialogFile, setCropDialogFile] = React.useState<File | null>(null)

  const onDrop = React.useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setErrorMessage(null)

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

      // Open crop dialog for the first image
      if (acceptedFiles[0]?.type.startsWith("image/")) {
        setCropDialogFile(acceptedFiles[0])
        return
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      )

      const updatedFiles = files ? [...files, ...newFiles] : newFiles

      setFiles(updatedFiles)

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }) => {
          setErrorMessage(
            t("fileUploader.errors.fileRejected", { fileName: file.name }),
          )
        })
      }

      if (
        onUpload &&
        updatedFiles.length > 0 &&
        updatedFiles.length <= maxFileCount
      ) {
        try {
          await onUpload(updatedFiles)
        } catch (error) {
          console.error("Upload failed:", error)
        }
      }
    },
    [files, maxFileCount, multiple, onUpload, setFiles, t],
  )

  function onRemove(index: number) {
    if (!files) return

    const newFiles = files.filter((_, i) => i !== index)

    setFiles(newFiles)
    onValueChange?.(newFiles)
  }

  React.useEffect(() => {
    return () => {
      files?.forEach((file) => {
        if ("preview" in file) {
          URL.revokeObjectURL(file.preview as string)
        }
      })
    }
  }, [files])

  const isDisabled = disabled || (files?.length ?? 0) >= maxFileCount

  const handleCropComplete = (croppedFile: File) => {
    const newFiles = [croppedFile]
    setFiles(files ? [...files, ...newFiles] : newFiles)
    if (onUpload) {
      onUpload(newFiles).catch(console.error)
    }
  }

  return (
    <div className="relative flex flex-col gap-3 overflow-hidden">
      {!isDisabled && (
        <Dropzone
          onDrop={onDrop}
          accept={accept}
          maxSize={maxSize}
          maxFiles={maxFileCount}
          multiple={maxFileCount > 1 || multiple}
          disabled={isDisabled}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={cn(
                "border-muted-foreground/25 hover:bg-muted/25 group relative grid h-32 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-4 py-2 text-center transition",
                "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isDragActive && "border-muted-foreground/50",
                isDisabled && "pointer-events-none opacity-60",
                className,
              )}
              {...dropzoneProps}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload
                    className="text-muted-foreground size-5"
                    aria-hidden="true"
                  />
                  <p className="text-muted-foreground text-sm font-medium">
                    {t("fileUploader.dropHere")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Upload
                    className="text-muted-foreground size-5"
                    aria-hidden="true"
                  />
                  <p className="text-muted-foreground text-sm font-medium">
                    {t("fileUploader.clickOrDrag")}
                  </p>
                  <p className="text-muted-foreground/70 text-xs">
                    {(() => {
                      const size = formatBytes(maxSize)
                      const countLabel =
                        maxFileCount === Infinity
                          ? t("fileUploader.multiple")
                          : maxFileCount

                      return maxFileCount > 1
                        ? t("fileUploader.limitMany", {
                            count:
                              typeof countLabel === "number" ? countLabel : 0,
                            size,
                          })
                        : t("fileUploader.limitSingle", { size })
                    })()}
                  </p>
                </div>
              )}
            </div>
          )}
        </Dropzone>
      )}
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
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
        file={cropDialogFile!}
        isOpen={!!cropDialogFile}
        onOpenChange={(open) => !open && setCropDialogFile(null)}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}

interface FileCardProps {
  file: File
  onRemove: () => void
  onOCRComplete?: (amount: number) => void
  progress?: number
}

interface ImageSelectionDialogProps {
  file: File
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectionComplete: (imageData: ImageData | null) => void
}

function ImageSelectionDialog({
  file,
  isOpen,
  onOpenChange,
  onSelectionComplete,
}: ImageSelectionDialogProps) {
  const { t } = useTranslation("common")
  const [crop, setCrop] = React.useState<Crop>()
  const [imgSrc, setImgSrc] = React.useState("")
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setImgSrc(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const getCroppedImageData = React.useCallback((): ImageData | null => {
    if (!imgRef.current) return null
    const image = imgRef.current

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    if (!(crop && crop.width > 0 && crop.height > 0)) {
      // If no crop selection, use the entire image
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      return ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

    // Calculate dimensions based on the original image
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Set canvas size to the crop size
    canvas.width = (crop.width * image.width * scaleX) / 100
    canvas.height = (crop.height * image.height * scaleY) / 100

    // Draw the cropped image
    ctx.drawImage(
      image,
      (crop.x * image.width * scaleX) / 100,
      (crop.y * image.height * scaleY) / 100,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }, [crop])

  const handleConfirm = () => {
    const imageData = getCroppedImageData()
    onSelectionComplete(imageData)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("fileUploader.ocr.title")}</DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 min-h-[20vh] w-full overflow-hidden">
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
                  <ReactCrop
                    crop={crop}
                    onChange={(_crop: Crop, percentCrop: Crop) =>
                      setCrop(percentCrop)
                    }
                    aspect={undefined}
                    className="flex max-h-full max-w-full items-center justify-center"
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt={t("fileUploader.ocr.imageAlt")}
                      className="max-h-full max-w-full w-auto h-auto object-contain"
                    />
                  </ReactCrop>
                </TransformComponent>
                <div className="bg-background/80 absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur z-10">
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
                    <NextImage
                      src={imgSrc}
                      alt={t("fileUploader.crop.resetZoomAlt")}
                      width={16}
                      height={16}
                      className="size-4 object-cover"
                    />
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
        <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setCrop(undefined)
              onSelectionComplete(null)
            }}
          >
            {t("fileUploader.ocr.clearSelection")}
          </Button>
          <Button onClick={handleConfirm}>
            {crop && crop.width > 0 && crop.height > 0
              ? t("fileUploader.ocr.processSelection")
              : t("fileUploader.ocr.processEntireImage")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FileCard({ file, progress, onRemove }: FileCardProps) {
  const [isSelectionOpen, setIsSelectionOpen] = React.useState(false)
  const { t } = useTranslation("common")

  return (
    <div className="group relative flex items-center gap-2.5 rounded-md border bg-card p-2 transition-colors hover:bg-accent/50">
      <div className="relative shrink-0">
        {file.type.startsWith("image/") || file.type === "application/pdf" ? (
          <FilePreview file={file} />
        ) : (
          <div className="bg-muted relative aspect-square size-14 shrink-0 overflow-hidden rounded-md border flex items-center justify-center">
            <FileText className="text-muted-foreground size-5" aria-hidden="true" />
          </div>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -right-1 -top-1 size-5 rounded-full shadow-md opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="size-2.5" aria-hidden="true" />
          <span className="sr-only">
            {t("fileUploader.card.removeFile")}
          </span>
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-col gap-0.5">
          <p className="text-foreground line-clamp-1 text-xs font-medium">
            {file.name}
          </p>
          <p className="text-muted-foreground text-[10px]">
            {formatBytes(file.size)}
          </p>
        </div>
        {progress !== undefined && <Progress value={progress} className="h-1" />}
      </div>

      <ImageSelectionDialog
        file={file}
        isOpen={isSelectionOpen}
        onOpenChange={setIsSelectionOpen}
        onSelectionComplete={() => {}}
      />
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
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{file.name}</DialogTitle>
            </DialogHeader>
            <div className="relative flex-1 min-h-[20vh] w-full overflow-hidden flex items-center justify-center">
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
                      <NextImage
                        src={preview}
                        alt={file.name}
                        width={1200}
                        height={800}
                        className="max-h-full max-w-full w-auto h-auto object-contain"
                        loading="lazy"
                        unoptimized
                      />
                    </TransformComponent>
                    <div className="bg-background/80 absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur z-10">
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
                        <NextImage
                          src={preview}
                          alt={file.name}
                          width={16}
                          height={16}
                          className="size-4 object-cover"
                        />
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
          className="bg-muted relative aspect-square size-14 shrink-0 overflow-hidden rounded-md border transition-opacity hover:opacity-90"
        >
          <iframe
            src={preview}
            title={file.name}
            className="h-full w-full"
            style={{ border: "none", pointerEvents: "none" }}
          />
        </button>

        <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{file.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 w-full overflow-hidden">
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
    <FileText className="text-muted-foreground size-10" aria-hidden="true" />
  )
}
