import { FocusTrap } from "focus-trap-react";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  buttonDeletePrimaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase from "./ModalBase";
import { ReactNode, useState } from "react";
import { request } from "http";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmOnDelete?: boolean;
  confirmDeleteMessage?: string | ReactNode;
  nestedModal?: boolean;
};

const DeleteModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const requestDelete = () => {
    if (props.confirmOnDelete) {
      setShowConfirmModal(true);
    } else {
      props.onConfirm();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    props.onConfirm();
    props.onClose();
  };

  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      {props.isOpen && (
        <ModalBase
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={TrashIcon}
          label={t("DeleteModal/Label")}
          disableClickOutside={showConfirmModal || props.nestedModal}
          nestedModal={props.nestedModal}
          smallModal
        >
          <ModalBase.Content>
            <p>{t("DeleteModal/Message")}</p>
          </ModalBase.Content>

          <ModalBase.Footer>
            <button
              type="button"
              onClick={requestDelete}
              className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
            >
              {t("DeleteModal/Delete")}
            </button>
            <button
              type="button"
              onClick={props.onClose}
              className={`${buttonSecondaryClass} xs:col-span-1 col-span-3`}
            >
              {t("Modal/Abort")}
            </button>
          </ModalBase.Footer>
        </ModalBase>
      )}

      {showConfirmModal && (
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            allowOutsideClick: true,
            escapeDeactivates: false,
          }}
        >
          <div className="fixed inset-0 z-[var(--z-overlay)] h-full w-screen bg-black/75">
            <div className="relative top-1/2">
              <div className="relative left-1/2 z-[calc(var(--z-modal))] flex w-[90vw] max-w-md -translate-1/2 flex-col overflow-x-hidden rounded-2xl bg-[var(--bg-modal)] p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility] duration-[var(--fast)]">
                <p className="mb-6 text-[var(--text-main)]">
                  {props.confirmDeleteMessage ?? t("DeleteModal/Confirm")}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={handleConfirmClose}
                    className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
                  >
                    {t("DeleteModal/Delete anyway")}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className={`${buttonSecondaryClass} xs:col-span-1 col-span-3`}
                  >
                    {t("Modal/Abort")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FocusTrap>
      )}
    </>
  );
};

export default DeleteModal;
