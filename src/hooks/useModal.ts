import { useState, useCallback } from 'react';

interface ModalState<T> {
  isOpen: boolean;
  data: T | null;
}

interface UseModalOptions<T> {
  initialIsOpen?: boolean;
  initialData?: T | null;
  onOpen?: (data?: T) => void;
  onClose?: (data?: T) => void;
}

/**
 * A custom hook for managing modal/dialog state
 * @param options - Configuration options for the modal
 * @returns Modal state and control functions
 * 
 * @example
 * // Basic usage
 * const { isOpen, openModal, closeModal } = useModal();
 * 
 * // With data
 * const { isOpen, data, openModal, closeModal } = useModal<{ id: string }>();
 * 
 * // With callbacks
 * const { isOpen, openModal, closeModal } = useModal({
 *   onOpen: (data) => console.log('Modal opened with data:', data),
 *   onClose: (data) => console.log('Modal closed with data:', data)
 * });
 */
const useModal = <T = any>(options: UseModalOptions<T> = {}) => {
  const {
    initialIsOpen = false,
    initialData = null,
    onOpen,
    onClose,
  } = options;

  const [modalState, setModalState] = useState<ModalState<T>>({
    isOpen: initialIsOpen,
    data: initialData,
  });

  /**
   * Open the modal with optional data
   * @param data - Data to pass to the modal
   */
  const openModal = useCallback(
    (data?: T) => {
      setModalState({
        isOpen: true,
        data: data ?? null,
      });
      if (onOpen) {
        onOpen(data);
      }
    },
    [onOpen]
  );

  /**
   * Close the modal with optional data
   * @param data - Data to pass to the onClose callback
   */
  const closeModal = useCallback(
    (data?: T) => {
      setModalState((prev) => ({
        isOpen: false,
        data: data ?? prev.data,
      }));
      if (onClose) {
        onClose(data);
      }
    },
    [onClose]
  );

  /**
   * Toggle the modal's open state
   * @param isOpen - Optional: force the modal to be open or closed
   * @param data - Optional: data to pass to the modal
   */
  const toggleModal = useCallback(
    (isOpen?: boolean, data?: T) => {
      if (isOpen !== undefined) {
        if (isOpen) {
          openModal(data);
        } else {
          closeModal(data);
        }
      } else {
        setModalState((prev) => {
          const newIsOpen = !prev.isOpen;
          if (newIsOpen) {
            if (onOpen) onOpen(data);
          } else if (onClose) {
            onClose(data);
          }
          return {
            isOpen: newIsOpen,
            data: data ?? prev.data,
          };
        });
      }
    },
    [closeModal, onClose, onOpen, openModal]
  );

  /**
   * Update the modal's data without changing its open state
   * @param data - New data for the modal
   */
  const updateModalData = useCallback((data: T) => {
    setModalState((prev) => ({
      ...prev,
      data,
    }));
  }, []);

  /**
   * Reset the modal to its initial state
   */
  const resetModal = useCallback(() => {
    setModalState({
      isOpen: initialIsOpen,
      data: initialData,
    });
  }, [initialIsOpen, initialData]);

  return {
    // State
    isOpen: modalState.isOpen,
    data: modalState.data,
    
    // Actions
    openModal,
    closeModal,
    toggleModal,
    updateModalData,
    resetModal,
    
    // For convenience in rendering
    modalProps: {
      open: modalState.isOpen,
      onClose: () => closeModal(),
    },
    
    // For MUI Dialogs
    dialogProps: {
      open: modalState.isOpen,
      onClose: () => closeModal(),
      fullWidth: true,
      maxWidth: 'sm',
    },
  };
};

export default useModal;
