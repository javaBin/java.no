"use client"

import * as React from "react"
import NextImage from "next/image"
import { FileText, Upload, X } from "lucide-react"
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone"
import { toast } from "sonner"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { ZoomIn, ZoomOut } from "lucide-react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <div className="relative h-[75vh] w-full gap-4">
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
                  wrapperClass="!w-full h-full"
                  contentClass="!w-full h-full flex items-center justify-center"
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    className="flex max-h-[70vh] items-center justify-center"
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt="Crop me"
                      onLoad={onImageLoad}
                      className="max-h-[70vh] w-auto object-contain"
                    />
                  </ReactCrop>
                </TransformComponent>
                <div className="bg-background/80 absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => zoomOut()}
                  >
                    <ZoomOut className="size-4" />
                    <span className="sr-only">Zoom out</span>
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
                      alt="Reset zoom"
                      width={16}
                      height={16}
                      className="size-4 object-cover"
                    />
                    <span className="sr-only">Reset zoom</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => zoomIn()}
                  >
                    <ZoomIn className="size-4" />
                    <span className="sr-only">Zoom in</span>
                  </Button>
                </div>
              </>
            )}
          </TransformWrapper>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={cropImage}>Crop & Continue</Button>
          </div>
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

  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
  })

  const [cropDialogFile, setCropDialogFile] = React.useState<File | null>(null)

  const onDrop = React.useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        toast.error("Cannot upload more than 1 file at a time")
        return
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFileCount) {
        toast.error(`Cannot upload more than ${maxFileCount} files`)
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
          toast.error(`File ${file.name} was rejected`)
        })
      }

      if (
        onUpload &&
        updatedFiles.length > 0 &&
        updatedFiles.length <= maxFileCount
      ) {
        const target =
          updatedFiles.length > 1 ? `${updatedFiles.length} files` : `file`

        try {
          await toast.promise(onUpload(updatedFiles), {
            loading: `Uploading ${target}...`,
            success: `${target} uploaded`,
            error: `Failed to upload ${target}`,
          })
        } catch (error) {
          console.error("Upload failed:", error)
        }
      }
    },
    [files, maxFileCount, multiple, onUpload, setFiles],
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
    <div className="relative flex flex-col gap-6 overflow-hidden">
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
                "border-muted-foreground/25 hover:bg-muted/25 group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-5 py-2.5 text-center transition",
                "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isDragActive && "border-muted-foreground/50",
                isDisabled && "pointer-events-none opacity-60",
                className,
              )}
              {...dropzoneProps}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                  <div className="rounded-full border border-dashed p-3">
                    <Upload
                      className="text-muted-foreground size-7"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Drop the files here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                  <div className="rounded-full border border-dashed p-3">
                    <Upload
                      className="text-muted-foreground size-7"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-px">
                    <p className="text-muted-foreground font-medium">
                      Drag {`'n'`} drop files here, or click to select files
                    </p>
                    <p className="text-muted-foreground/70 text-sm">
                      You can upload
                      {maxFileCount > 1
                        ? ` ${maxFileCount === Infinity ? "multiple" : maxFileCount}
                      files (up to ${formatBytes(maxSize)} each)`
                        : ` a file with ${formatBytes(maxSize)}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Dropzone>
      )}
      {files?.length ? (
        <ScrollArea className="h-fit w-full px-3">
          <div className="flex max-h-48 flex-col gap-4">
            {files?.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                onRemove={() => onRemove(index)}
                progress={progresses?.[file.name]}
              />
            ))}
          </div>
        </ScrollArea>
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Area for OCR</DialogTitle>
        </DialogHeader>
        <div className="relative h-[75vh] w-full">
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
                  wrapperClass="!w-full h-full"
                  contentClass="!w-full h-full flex items-center justify-center"
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    aspect={undefined}
                    className="max-h-[70vh] w-auto"
                  >
                    <img
                      ref={imgRef}
                      src={imgSrc}
                      alt="Select area"
                      className="max-h-[70vh] w-auto object-contain"
                    />
                  </ReactCrop>
                </TransformComponent>
                <div className="bg-background/80 absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => zoomOut()}
                  >
                    <ZoomOut className="size-4" />
                    <span className="sr-only">Zoom out</span>
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
                      alt="Reset zoom"
                      width={16}
                      height={16}
                      className="size-4 object-cover"
                    />
                    <span className="sr-only">Reset zoom</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => zoomIn()}
                  >
                    <ZoomIn className="size-4" />
                    <span className="sr-only">Zoom in</span>
                  </Button>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setCrop(undefined)
              onSelectionComplete(null)
            }}
          >
            Clear Selection
          </Button>
          <Button onClick={handleConfirm}>
            Process{" "}
            {crop && crop.width > 0 && crop.height > 0
              ? "Selection"
              : "Entire Image"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FileCard({ file, progress, onRemove }: FileCardProps) {
  const [isSelectionOpen, setIsSelectionOpen] = React.useState(false)

  return (
    <div className="relative flex items-center gap-2.5">
      <div className="flex flex-1 gap-2.5">
        {file.type.startsWith("image/") || file.type === "application/pdf" ? (
          <FilePreview file={file} />
        ) : null}
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-px">
            <p className="text-foreground/80 line-clamp-1 text-sm font-medium">
              {file.name}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs">
                {formatBytes(file.size)}
              </p>
            </div>
          </div>
          {progress ? <Progress value={progress} /> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={onRemove}
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Remove file</span>
        </Button>
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
          className="relative aspect-square size-12 shrink-0 overflow-hidden rounded-md border"
        >
          <NextImage
            src={preview}
            alt={file.name}
            width={48}
            height={48}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </button>

        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{file.name}</DialogTitle>
            </DialogHeader>
            <div className="relative flex h-[75vh] w-full items-center justify-center">
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
                      wrapperClass="!w-full"
                      contentClass="!w-full flex items-center justify-center"
                    >
                      <NextImage
                        src={preview}
                        alt={file.name}
                        width={1200}
                        height={800}
                        className="max-h-[70vh] w-auto object-contain"
                        loading="lazy"
                        unoptimized
                      />
                    </TransformComponent>
                    <div className="bg-background/80 absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2 backdrop-blur">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => zoomOut()}
                      >
                        <ZoomOut className="size-4" />
                        <span className="sr-only">Zoom out</span>
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
                        <span className="sr-only">Reset zoom</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => zoomIn()}
                      >
                        <ZoomIn className="size-4" />
                        <span className="sr-only">Zoom in</span>
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
          className="bg-muted relative aspect-square size-12 shrink-0 overflow-hidden rounded-md border"
        >
          <FileText
            className="text-muted-foreground absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        </button>

        <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{file.name}</DialogTitle>
            </DialogHeader>
            <div className="h-[75vh] w-full">
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
