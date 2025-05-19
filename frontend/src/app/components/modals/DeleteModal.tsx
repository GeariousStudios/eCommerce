import { FocusTrap } from "focus-trap-react";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  buttonDeletePrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const DeleteModal = (props: Props) => {
  return (
    <>
      {props.isOpen && (
        <div className="fixed inset-0 z-[var(--z-overlay)] h-svh w-screen bg-black/50">
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              allowOutsideClick: true,
              escapeDeactivates: false,
            }}
          >
            <div className="relative top-1/2 left-1/2 z-[var(--z-modal)] flex max-h-[90svh] w-[90vw] max-w-3xl min-w-[90vw] -translate-1/2 flex-col overflow-y-auto rounded border-1 border-[var(--border-main)] bg-[var(--bg-modal)] p-4 md:min-w-auto">
              <h2 className="mb-4 flex items-center text-2xl font-semibold">
                <TrashIcon className="mr-2 h-6 w-6 text-[var(--button-delete)]" />
                Är du säker?
              </h2>
              <p>Ett borttaget objekt går ej att få tillbaka.</p>
              <div className="mt-8 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={props.onClose}
                  className={`${buttonSecondaryClass} grow`}
                >
                  Ångra
                </button>
                <button
                  type="button"
                  onClick={props.onConfirm}
                  className={`${buttonDeletePrimaryClass} grow-2`}
                >
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

export default DeleteModal;
