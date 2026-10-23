import { extractBackendMsg } from "@/api/models/apiResponse";
import { useModal } from "@/components/modals/ModalContext";
import { MediaData, defaultMediaDataUploadState } from "@/constants/media";
import * as ImageManipulator from "expo-image-manipulator";
import { useUpdateProfilePicture } from "./queries/useUserApi";
import { useImagePicker } from "./useImagePicker";
import { useUploadMedia } from "./useUploadMedia";

type useChangeProfilePictureType = {
  cleanUpFn?: () => void
}

type useChangeProfilePictureState = {
  chooseFromGallery: () => void
  takeNewPhoto: () => void
  removePhoto: () => void
}

export default function useChangeProfilePicture({ cleanUpFn }: useChangeProfilePictureType): useChangeProfilePictureState {

  const cleanUpFunction = () => {
    // to avoid conditional chaining inside try catch
    cleanUpFn?.()
  }
  const { showModal, hideModal } = useModal()
  const { mutateAsync: updateProfilePictureKey } = useUpdateProfilePicture()
  const { upload } = useUploadMedia({})

  const handleChangePic = async (image: MediaData) => {
    // crop to a centered square first
    const size = Math.min(image.width!, image.height!)
    const originX = (image.width! - size) / 2
    const originY = (image.height! - size) / 2

    const context = ImageManipulator.ImageManipulator
      .manipulate(image.localUri)
      .crop({ originX, originY, width: size, height: size })

    const original = (await context.renderAsync()).saveAsync({ compress: .8 })
    const thumbnail = (await context.resize({ width: 150, height: 150 }).renderAsync()).saveAsync({ compress: .8 })
    try {
      const file = await upload({
        id: "",
        localUri: (await original).uri,
        thumbnail: (await thumbnail).uri,
        type: "profilePhoto",
        resizeMode: "contain",
        uploadState: defaultMediaDataUploadState(),
      })

      // to avoid conditional chaining inside try catch
      let t = ""
      if (file.thumbnail) {
        t = file.thumbnail.mediaKey
      }

      await updateProfilePictureKey({
        imageKey: file.media.mediaKey,
        thumbnailKey: t
      })

      cleanUpFunction()
    } catch (error) {
      showModal({
        message: extractBackendMsg(error),
        onPrimary: hideModal,
        primaryBtnText: "Ok"
      })
    }
  }

  const { pickFromGallery, takePhoto } = useImagePicker()

  const chooseFromGallery = () => {
    pickFromGallery({ mediaTypes: ["images"], onPictureChosen: image => handleChangePic(image) }, false)
  }

  const takeNewPhoto = () => {
    takePhoto({
      aspect: [1, 1], onPictureChosen: image => {
        handleChangePic(image)
      }
    })
  }

  const removePhoto = () => {
    updateProfilePictureKey({
      imageKey: "",
      thumbnailKey: "",
    }, {
      onSuccess() {
        cleanUpFunction()
      },
      onError() {
        showModal({
          message: "Failed to update profile picture, try again.",
          primaryBtnText: "Close",
          onPrimary: hideModal
        })
      }
    })

  }

  return {
    chooseFromGallery,
    takeNewPhoto,
    removePhoto,
  }
}