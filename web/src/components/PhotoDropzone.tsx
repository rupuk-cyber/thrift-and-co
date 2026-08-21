"use client";

import { ChangeEvent, DragEvent, useId, useRef, useState } from "react";
import { compressImage, validateImageFile } from "./photo";

export interface SelectedPhoto {
  compressed: File;
  previewUrl: string;
  originalName: string;
  originalSize: number;
}

interface PhotoDropzoneProps {
  photo: SelectedPhoto | null;
  onSelect: (photo: SelectedPhoto) => void;
  onClear: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function PhotoDropzone({ photo, onSelect, onClear, onError, disabled }: PhotoDropzoneProps) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const busyRef = useRef(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled || busyRef.current) return;
    const problem = validateImageFile(file);
    if (problem) {
      onError(problem);
      return;
    }
    busyRef.current = true;
    try {
      const compressed = await compressImage(file);
      onSelect({
        compressed,
        previewUrl: URL.createObjectURL(compressed),
        originalName: file.name,
        originalSize: file.size,
      });
    } catch {
      onError("That image could not be processed — please try another photo.");
    } finally {
      busyRef.current = false;
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragOver(false);
    void handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="form-group">
      <label htmlFor={inputId}>
        Photo{" "}
        <span className="required" aria-hidden="true">
          *
        </span>
        <span className="sr-only">(required)</span>
      </label>
      {!photo ? (
        <label
          className={`dropzone${dragOver ? " dragover" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={onInputChange}
            disabled={disabled}
          />
          <span className="dropzone-icon" aria-hidden="true">
            📷
          </span>
          Drag &amp; drop a photo here, or click to browse
          <span className="field-hint">One photo required · JPEG, PNG or WebP · up to 10 MB</span>
        </label>
      ) : (
        <div className="photo-preview">
          <img src={photo.previewUrl} alt="Preview of the selected photo" />
          <button
            type="button"
            className="remove-btn"
            aria-label="Remove photo"
            onClick={() => {
              URL.revokeObjectURL(photo.previewUrl);
              onClear();
            }}
            disabled={disabled}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
