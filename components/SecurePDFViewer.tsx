import React from "react";

interface SecurePDFViewerProps {
  driveUrl: string;
  title: string;
  onClose: () => void;
}

const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({
  driveUrl,
  title,
  onClose,
}) => {
  // Convert Google Drive URL to preview format
  const getPreviewUrl = (url: string): string => {
    try {
      let fileId = "";

      // Extract file ID from various Google Drive URL formats
      if (url.includes("/file/d/")) {
        fileId = url.split("/file/d/")[1].split("/")[0];
      } else if (url.includes("id=")) {
        fileId = url.split("id=")[1].split("&")[0];
      } else if (url.includes("/open?id=")) {
        fileId = url.split("/open?id=")[1].split("&")[0];
      }

      // Use preview format with embedded parameter for better fit
      // rm=minimal removes extra UI elements
      return `https://drive.google.com/file/d/${fileId}/preview?rm=minimal&embedded=true`;
    } catch (error) {
      console.error("Error parsing Drive URL:", error);
      // If parsing fails, try to convert /view to /preview if it exists
      if (url.includes("/view")) {
        return url.replace("/view", "/preview") + "?rm=minimal&embedded=true";
      }
      return url;
    }
  };

  const previewUrl = getPreviewUrl(driveUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Simple Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Simple iframe */}
        <div className="flex-1">
          <iframe
            src={previewUrl}
            width="100%"
            height="100%"
            allow="autoplay"
            className="border-0"
            title={title}
          />
        </div>
      </div>
    </div>
  );
};

export default SecurePDFViewer;
