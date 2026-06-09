import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Camera, Eye, ZoomIn, ExternalLink, FileText } from 'lucide-react';
import type { RecheckImage, VersionHistory } from '@/types';
import { useInspectionStore } from '@/store/useInspectionStore';

interface RecheckImageGalleryProps {
  recordId: string;
  images: RecheckImage[];
  versionHistory?: VersionHistory[];
  initiallyExpanded?: boolean;
  showInternalFields?: boolean;
}

export const RecheckImageGallery: React.FC<RecheckImageGalleryProps> = ({
  recordId,
  images,
  versionHistory = [],
  initiallyExpanded = false,
  showInternalFields = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [selectedImage, setSelectedImage] = useState<RecheckImage | null>(null);
  const { setHighlightedVersion, highlightedVersionId } = useInspectionStore();
  
  const regularImages = images.filter(img => !img.isSupplemental);
  const supplementalImages = images.filter(img => img.isSupplemental);
  
  const handleVersionClick = (versionTag: string) => {
    const version = versionHistory.find(vh => vh.versionNumber === versionTag);
    if (version) {
      setHighlightedVersion(version.id);
      const element = document.getElementById(`version-${version.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  const handleImageClick = (image: RecheckImage) => {
    setSelectedImage(image);
  };
  
  const closeModal = () => {
    setSelectedImage(null);
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-primary-50 to-white hover:from-primary-100 transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-primary-500" />
          <div className="text-left">
            <span className="font-semibold text-primary-700">
              热斑复测截图
            </span>
            <span className="ml-2 text-sm text-gray-500">
              ({images.length}张)
            </span>
          </div>
          {supplementalImages.length > 0 && (
            <span className="badge supplemental-badge animate-pulse-slow">
              {supplementalImages.length}张补录
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showInternalFields && (
            <span className="text-xs text-gray-400 font-mono mr-2">
              IMG_{recordId}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-primary-500 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary-500 group-hover:scale-110 transition-transform" />
          )}
        </div>
      </button>
      
      <div
        className={`accordion-content ${isExpanded ? 'animate-slide-down' : ''}`}
        style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0 }}
      >
        <div className="p-4 bg-gray-50">
          {regularImages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                检测图片
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {regularImages.map((image, index) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    index={index}
                    onClick={() => handleImageClick(image)}
                    onVersionClick={() => handleVersionClick(image.versionTag)}
                    highlighted={highlightedVersionId === versionHistory.find(vh => vh.versionNumber === image.versionTag)?.id}
                  />
                ))}
              </div>
            </div>
          )}
          
          {supplementalImages.length > 0 && (
            <div className="supplemental-border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-white">
              <h4 className="text-sm font-medium text-accent-gold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                老何手工补录
                <span className="badge supplemental-badge ml-2">
                  补录
                </span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {supplementalImages.map((image, index) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    index={index}
                    isSupplemental
                    onClick={() => handleImageClick(image)}
                    onVersionClick={() => handleVersionClick(image.versionTag)}
                    highlighted={highlightedVersionId === versionHistory.find(vh => vh.versionNumber === image.versionTag)?.id}
                  />
                ))}
              </div>
            </div>
          )}
          
          {images.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无复测图片</p>
            </div>
          )}
        </div>
      </div>
      
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedImage.description}</h3>
                <p className="text-sm text-gray-500">
                  {selectedImage.imageType} · {selectedImage.capturedAt} · {selectedImage.capturedBy}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.description}
                className="w-full h-auto rounded-lg"
                loading="lazy"
              />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-500">图片类型:</span>
                  <span className="ml-2 font-medium">{selectedImage.imageType}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-500">版本标签:</span>
                  <span className="ml-2 font-mono font-medium text-primary-600">{selectedImage.versionTag}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-500">拍摄时间:</span>
                  <span className="ml-2 font-medium">{selectedImage.capturedAt}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-500">拍摄人:</span>
                  <span className="ml-2 font-medium">{selectedImage.capturedBy}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ImageCardProps {
  image: RecheckImage;
  index: number;
  isSupplemental?: boolean;
  onClick: () => void;
  onVersionClick: () => void;
  highlighted?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  isSupplemental = false,
  onClick,
  onVersionClick,
  highlighted = false,
}) => {
  return (
    <div
      className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
        isSupplemental ? 'supplemental-border' : 'border border-gray-200'
      } ${highlighted ? 'ring-2 ring-primary-400 ring-offset-2' : 'hover:shadow-lg'}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={image.imageUrl}
          alt={image.description}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <p className="text-xs line-clamp-2 mb-1">{image.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span>{image.imageType}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute top-2 left-2 flex gap-1">
        <span
          onClick={e => {
            e.stopPropagation();
            onVersionClick();
          }}
          className={`text-xs px-2 py-0.5 rounded-full font-mono cursor-pointer transition-all ${
            isSupplemental
              ? 'bg-accent-gold text-white hover:bg-accent-gold/80'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {image.versionTag}
        </span>
      </div>
      
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => {
            e.stopPropagation();
            onClick();
          }}
          className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
          title="查看大图"
        >
          <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onVersionClick();
          }}
          className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
          title="追溯版本"
        >
          <ExternalLink className="w-3.5 h-3.5 text-gray-700" />
        </button>
      </div>
      
      {isSupplemental && (
        <div className="absolute bottom-2 right-2">
          <span className="badge supplemental-badge text-xs">
            补录
          </span>
        </div>
      )}
      
      <div className="p-2 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1">
          <Eye className="w-3 h-3 text-gray-400" />
          {image.description}
        </p>
      </div>
    </div>
  );
};
