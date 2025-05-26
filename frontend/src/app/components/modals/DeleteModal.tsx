import { FocusTrap } from "focus-trap-react";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  buttonDeletePrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase from "./ModalBase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const DeleteModal = (props: Props) => {
  return (
    <>
      {props.isOpen && (
        <ModalBase
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={TrashIcon}
          label="Är du säker?"
        >
          <div className="relative flex gap-8 flex-col">
            <p>Ett borttaget objekt går ej att få tillbaka.</p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={props.onConfirm}
                className={`${buttonDeletePrimaryClass} w-full grow-2 sm:w-auto`}
              >
                Ta bort
              </button>
              <button
                type="button"
                onClick={props.onClose}
                className={`${buttonSecondaryClass} w-full grow sm:w-auto`}
              >
                Ångra
              </button>
            </div>
          </div>
        </ModalBase>
      )}
    </>
  );
};

export default DeleteModal;
