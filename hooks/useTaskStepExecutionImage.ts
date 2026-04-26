// hooks/useTaskStepExecutionImage.ts
import axiosInstance from "@/lib/axios";

export const useTaskStepExecutionImage = () => {
  const buildFormData = (
    photos: { uri: string }[],
    minPhotos: number,
  ): FormData => {
    const formData = new FormData();
    formData.append("MinPhotos", String(minPhotos));
    photos.forEach((photo, index) => {
      const filename = photo.uri.split("/").pop() || `photo_${index}.jpg`;
      formData.append("Images", {
        uri: photo.uri,
        name: filename,
        type: "image/jpeg",
      } as any);
    });
    return formData;
  };

  const uploadImages = async (
    taskStepExecutionId: string,
    imageType: 0 | 1 | 2,
    photos: { uri: string }[],
    minPhotos: number = 1,
  ) => {
    if (!taskStepExecutionId) throw new Error("Thiếu stepExecutionId");
    const formData = buildFormData(photos, minPhotos);
    const url = `/TaskStepExecutionImages/${taskStepExecutionId}/${imageType}`;

    console.log("📤 [uploadImages] POST");
    console.log("   fullURL :", axiosInstance.defaults.baseURL + url);
    console.log("   stepId  :", taskStepExecutionId);
    console.log("   type    :", imageType);
    console.log(
      "   photos  :",
      photos.map((p) => p.uri),
    );

    const { data } = await axiosInstance.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("✅ [uploadImages] response:", data);
    return data;
  };

  const reUploadImages = async (
    taskStepExecutionId: string,
    imageType: 0 | 1 | 2,
    photos: { uri: string }[],
    minPhotos: number = 1,
  ) => {
    if (!taskStepExecutionId) throw new Error("Thiếu stepExecutionId");
    const formData = buildFormData(photos, minPhotos);
    const url = `/TaskStepExecutionImages/${taskStepExecutionId}/${imageType}`;

    console.log("📤 [reUploadImages] PUT");
    console.log("   fullURL :", axiosInstance.defaults.baseURL + url);
    console.log("   stepId  :", taskStepExecutionId);
    console.log("   type    :", imageType);
    console.log(
      "   photos  :",
      photos.map((p) => p.uri),
    );

    const { data } = await axiosInstance.put(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("✅ [reUploadImages] response:", data);
    return data;
  };

  const getImagesByStep = async (
    taskAssignmentId: string,
    stepExecutionId: string,
    imageType: 0 | 1 | 2,
  ): Promise<string[]> => {
    // 👈 Map số → string khớp với BE trả về
    const imageTypeMap: Record<0 | 1 | 2, string> = {
      0: "Before",
      1: "After",
      2: "Ppe",
    };
    const imageTypeStr = imageTypeMap[imageType];

    const getUrl = `/TaskStepExecutionImages?taskAssignmentId=${taskAssignmentId}`;

    console.log("🔍 [getImagesByStep] GET");
    console.log("   fullURL      :", axiosInstance.defaults.baseURL + getUrl);
    console.log("   assignmentId :", taskAssignmentId);
    console.log("   stepId       :", stepExecutionId);
    console.log("   imageType    :", imageType, "→", imageTypeStr);

    const { data } = await axiosInstance.get(getUrl);

    const step = data.steps?.find(
      (s: any) => s.stepExecutionId === stepExecutionId,
    );

    console.log(
      "   matched step :",
      step ? `stepOrder ${step.stepOrder}` : "NOT FOUND",
    );

    if (!step) return [];

    const urls = step.images
      .filter((img: any) => img.imageType === imageTypeStr) // 👈 so sánh string
      .map((img: any) => img.imageUrl);

    console.log("   filtered URLs:", urls);
    return urls;
  };

  const deleteImagesByStep = async (
    taskStepExecutionId: string,
  ): Promise<boolean> => {
    if (!taskStepExecutionId) throw new Error("Thiếu stepExecutionId");
    const url = `/TaskStepExecutionImages/step/${taskStepExecutionId}`;
    console.log(
      "🗑️ [deleteImagesByStep] DELETE",
      axiosInstance.defaults.baseURL + url,
    );
    const { data } = await axiosInstance.delete(url);
    console.log("✅ [deleteImagesByStep] response:", data);
    return true;
  };

  return { uploadImages, reUploadImages, getImagesByStep, deleteImagesByStep };
};
