'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setImageUrl('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImageUrl(data.url);
        alert('✅ Upload successful!');
      } else {
        setError(data.error || 'Upload failed');
        alert('❌ Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
      alert('❌ Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#722F37] mb-6">
          🚀 Test AWS S3 + CloudFront Upload
        </h1>

        <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
              Select Image to Upload
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="block w-full text-sm text-[#6B6B6B]
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-[#722F37] file:text-white
                hover:file:bg-[#8B3A45]
                file:cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {uploading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 font-medium">Uploading to AWS S3...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">❌ {error}</p>
            </div>
          )}

          {imageUrl && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold text-lg mb-2">
                  ✅ Upload Successful!
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-green-600 font-medium">CloudFront CDN URL:</p>
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                    >
                      {imageUrl}
                    </a>
                  </div>
                </div>
              </div>

              <div className="border border-[#E8E2D9] rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Uploaded to S3"
                  className="w-full h-auto max-h-[500px] object-contain"
                  onError={(e) => {
                    console.error('Image load error');
                    setError('Failed to load image from CloudFront');
                  }}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-[#2D2D2D] mb-2">✨ How it works:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-[#6B6B6B]">
                  <li>Image uploaded to AWS S3 bucket: <code className="bg-white px-1 py-0.5 rounded">fashion-points-images-2024</code></li>
                  <li>Served globally via CloudFront CDN for fast loading</li>
                  <li>Cached for 1 year for optimal performance</li>
                  <li>Cost: ~₹1,000/month vs Cloudinary ₹7,500/month (85% savings!)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl shadow-md border border-[#E8E2D9]">
          <h2 className="font-semibold text-[#2D2D2D] mb-3">📋 AWS Setup Details:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[#6B6B6B]"><span className="font-medium text-[#2D2D2D]">S3 Bucket:</span> fashion-points-images-2024</p>
              <p className="text-[#6B6B6B]"><span className="font-medium text-[#2D2D2D]">Region:</span> ap-south-1 (Mumbai)</p>
            </div>
            <div>
              <p className="text-[#6B6B6B]"><span className="font-medium text-[#2D2D2D]">CloudFront:</span> d3p9b9yka11dgj.cloudfront.net</p>
              <p className="text-[#6B6B6B]"><span className="font-medium text-[#2D2D2D]">Status:</span> ✅ Configured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
