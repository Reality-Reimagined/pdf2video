import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, FileText, Video as VideoIcon, Wand2, AlertCircle } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { ThemeInput } from './ThemeInput';
import { SubtitlesToggle } from '../SubtitlesToggle';
import { ModelSelector } from '../ModelSelector';
import { useVideoStore } from '../../lib/store';
import { useAuthStore } from '../../lib/store';
import { generateScript } from '../../lib/ai-service';
import { apiService } from '../../lib/api-service';

interface CreateVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateVideoDialog: React.FC<CreateVideoDialogProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState(1);
  const [pdfText, setPdfText] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { isProcessing, setIsProcessing, selectedModel, theme, addSubtitles } = useVideoStore();
  const { user, addVideo } = useAuthStore();

  const handlePdfUpload = async (file: File) => {
    try {
      setError(null);
      setIsProcessing(true);
      const text = await apiService.extractText(file);
      setPdfText(text);
      setStep(2);
    } catch (error) {
      setError('Failed to extract text from PDF. Please try again.');
      console.error('Error processing PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScriptGeneration = async () => {
    const apiKey = user?.apiKeys[selectedModel];
    if (!apiKey) {
      setError(`Please add your ${selectedModel.toUpperCase()} API key in settings.`);
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      const script = await generateScript(pdfText, {
        apiKey,
        model: selectedModel,
      });
      setGeneratedScript(script);
      setStep(3);
    } catch (error: any) {
      setError(error.message);
      console.error('Error generating script:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVideoGeneration = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      await apiService.generateVideo(generatedScript, {
        theme,
        addSubtitles,
      });
      
      // Add the video to the user's collection
      addVideo({
        id: Date.now().toString(),
        title: 'New Video',
        url: 'output_with_subtitles.mp4',
        createdAt: new Date().toISOString(),
        duration: 0, // This should be updated with actual duration
      });

      onOpenChange(false);
    } catch (error) {
      setError('Failed to generate video. Please try again.');
      console.error('Error generating video:', error);
    } finally {
      setIsProcessing(false);
      // Cleanup temporary files
      await apiService.cleanup();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">Create Video</Dialog.Title>
          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </Dialog.Close>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Upload className="w-5 h-5" />
                  <h3 className="font-medium">Upload PDF</h3>
                </div>
                <FileUploader onUpload={handlePdfUpload} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-medium">Generate Script</h3>
                </div>
                {pdfText && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Text</h4>
                    <p className="text-sm text-gray-600 max-h-40 overflow-y-auto">{pdfText}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <ModelSelector />
                  <button
                    onClick={handleScriptGeneration}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isProcessing ? 'Generating...' : 'Generate Script'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <VideoIcon className="w-5 h-5" />
                  <h3 className="font-medium">Generate Video</h3>
                </div>
                {generatedScript && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Script</h4>
                    <p className="text-sm text-gray-600">{generatedScript}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <ThemeInput />
                  <SubtitlesToggle />
                  <button
                    onClick={handleVideoGeneration}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <VideoIcon className="w-4 h-4" />
                    {isProcessing ? 'Generating...' : 'Generate Video'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};