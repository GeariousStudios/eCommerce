import { FocusTrap } from "focus-trap-react";
import { TrashIcon } from "@heroicons/react/24/outline";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const ConfirmModal = ({ isOpen, onClose, onConfirm }: Props) => {
  return (
    <>
      {isOpen && (
        <div className="w-vw fixed inset-0 z-[var(--z-overlay)] h-svh bg-black opacity-25">
          <FocusTrap focusTrapOptions={{ initialFocus: false }}>
            <div className="left 1/2 bg-navbar border-main relative top-1/2 z-[var(--z-modal)] flex max-h-[90svh] w-[90vw] max-w-3xl min-w-[90vw] -translate-1/2 flex-col overflow-y-auto rounded border-2 p-4 md:min-w-auto">
              <h2 className="mb-4 flex align-middle">
                <TrashIcon className="text-accent-color mr-0.5" />
                Är du säker?
              </h2>
              <p>Ett borttaget objekt går ej att få tillbaka.</p>
              <div className="mt-4 flex justify-between gap-4">
                <button type="button" onClick={onClose} className="w-1/3">
                  Ångra
                </button>
                <button type="button" onClick={onConfirm} className="w-2/3">
                  Ta bort
                </button>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
};

export default ConfirmModal;
