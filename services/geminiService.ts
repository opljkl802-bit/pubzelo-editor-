import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { EditedImageResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return await res.blob();
};

export const fileToDataUrl = (file: File | Blob): Promise<string> => 
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });


const fileToBase64 = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

export const editImage = async (
  file: File | Blob,
  prompt: string,
  maskDataUrl: string | null
): Promise<EditedImageResult | null> => {
  try {
    const base64Data = await fileToBase64(file);

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type || 'image/png',
      },
    };
    
    const textPart = {
      text: prompt,
    };
    
    const maskPart = maskDataUrl
      ? {
          inlineData: {
            data: maskDataUrl.split(",")[1],
            mimeType: "image/png",
          },
        }
      : null;

    const finalParts: any[] = [imagePart];
    if (maskPart) {
        finalParts.push(maskPart);
    }
    finalParts.push(textPart);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: finalParts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let resultImageUrl: string | null = null;
    let resultText: string = "No text response from AI.";

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        resultText = part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        resultImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    if (resultImageUrl) {
        return { imageUrl: resultImageUrl, text: resultText };
    }

    return null;

  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
            throw new Error("Image edit failed: You have exceeded your API usage quota. Please check your plan and billing details.");
        }
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while editing the image.");
  }
};


export const generateImage = async (prompt: string, aspectRatio: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return null;

    } catch(error) {
        console.error("Error generating image with Gemini API:", error);
        if (error instanceof Error) {
            if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
                throw new Error("Image generation failed: You have exceeded your API usage quota. Please check your plan and billing details.");
            }
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
};

export const generateVideo = async (
  prompt: string,
  onProgress: (status: string) => void
): Promise<string | null> => {
  try {
    onProgress("Starting video generation...");
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1
      }
    });
    onProgress("Request sent. The AI is creating your video. This can take several minutes...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      onProgress("Still working... High-quality video takes time!");
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed, but no download link was found.");
    }
    
    onProgress("Video is ready! Downloading now...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to download video file:", errorText);
        throw new Error(`Failed to download video file: ${response.statusText}`);
    }
    
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    onProgress("Download complete!");

    return videoUrl;
  } catch (error) {
    console.error("Error generating video with Gemini API:", error);
    onProgress("An error occurred during video generation.");
    if (error instanceof Error) {
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
            throw new Error("Video generation failed: You have exceeded your API usage quota. Please check your plan and billing details.");
        }
        throw new Error(`Failed to generate video: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the video.");
  }
};