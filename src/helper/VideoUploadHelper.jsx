import { useState } from "react";
import { Button, Input, message, Space, Spin, Upload } from "antd";
import { VideoCameraOutlined, LinkOutlined, LoadingOutlined } from "@ant-design/icons";
import { uploadVideo } from "../api";
import _ from "lodash";

const VideoUploadHelper = ({ setVideoPath, max = 1 }) => {
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const videoValidation = {
    beforeUpload: (file) => {
      const isVideo = (file.type && file.type.startsWith("video/")) || /\.(mp4|webm|ogg|mov|m4v)$/i.test(file.name);
      if (!isVideo) {
        message.warning(`${file.name} is not a supported video file (MP4, WebM, OGG, MOV)`);
        return Upload.LIST_IGNORE;
      }

      // Check max size: 100MB
      const isLt100M = file.size / 1024 / 1024 <= 100;
      if (!isLt100M) {
        message.error("Video file must be smaller than 100MB!");
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("image", file);

        const result = await uploadVideo(formData);
        const uploadedUrl = _.get(result, "data.data.url", "");

        if (uploadedUrl) {
          setVideoPath(uploadedUrl);
          message.success("Video uploaded successfully!");
          if (onSuccess) onSuccess(result.data);
        } else {
          message.error("Failed to get video URL from response");
          if (onError) onError(new Error("No URL returned"));
        }
      } catch (err) {
        console.error("Video upload error:", err);
        message.error(err?.response?.data?.message || "Failed to upload video. Please try again.");
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    },
    showUploadList: false,
    maxCount: max || 1,
    accept: "video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.m4v"
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) {
      message.warning("Please enter a valid video URL");
      return;
    }
    setVideoPath(inputUrl.trim());
    setInputUrl("");
    message.success("Video URL applied successfully!");
  };

  return (
    <div className="w-full">
      <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50 hover:border-blue-400 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Upload.Dragger 
            {...videoValidation} 
            className="!w-full !border-0 !bg-transparent"
            disabled={loading}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-2 text-primary">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <span className="text-xs text-blue-600 font-medium mt-2">Uploading video... Please wait</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-1 cursor-pointer">
                <VideoCameraOutlined className="text-2xl text-blue-500" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-700 m-0">Click or drag video file here</p>
                  <p className="text-[11px] text-gray-400 m-0">Supports MP4, WebM, MOV, OGG (Max: 100MB)</p>
                </div>
              </div>
            )}
          </Upload.Dragger>

          <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto justify-end">
            <Button 
              size="small" 
              type="text" 
              icon={<LinkOutlined />}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-gray-600 hover:text-blue-500"
              disabled={loading}
            >
              {showUrlInput ? "Hide URL" : "Paste URL"}
            </Button>
          </div>
        </div>

        {showUrlInput && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Space orientation="horizontal" className="w-full" style={{ display: 'flex' }}>
              <Input
                size="small"
                placeholder="https://example.com/video.mp4"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onPressEnter={handleApplyUrl}
                className="flex-1"
                disabled={loading}
              />
              <Button size="small" type="primary" onClick={handleApplyUrl} disabled={loading}>
                Apply
              </Button>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploadHelper;
