'use client';

import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => void;
  title: string;
  existingSignature?: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  existingSignature,
}: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen && sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  }, [isOpen]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  };

  const handleConfirm = () => {
    if (sigCanvas.current && !isEmpty) {
      const signatureData = sigCanvas.current.toDataURL('image/png');
      onConfirm(signatureData);
      onClose();
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      setIsEmpty(sigCanvas.current.isEmpty());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="signature-modal-overlay" onClick={onClose}>
      <div className="signature-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="signature-modal-header">
          <h3>{title}</h3>
          <button className="signature-close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="signature-canvas-container">
          <div className="signature-canvas-wrapper">
            {isEmpty && (
              <div className="signature-placeholder-text">请在此区域手写签名</div>
            )}
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'signature-canvas',
              }}
              onEnd={handleEnd}
              clearOnResize={false}
              penColor="black"
              minWidth={1.5}
              maxWidth={2.5}
              backgroundColor="transparent"
            />
          </div>
        </div>

        <div className="signature-modal-footer">
          <button className="signature-btn signature-btn-clear" onClick={handleClear}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清除
          </button>
          <button
            className="signature-btn signature-btn-confirm"
            onClick={handleConfirm}
            disabled={isEmpty}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            确认
          </button>
        </div>

        <div className="signature-hint">请在上方区域用手指书写签名</div>
      </div>
    </div>
  );
}
