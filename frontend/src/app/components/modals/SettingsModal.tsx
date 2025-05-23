import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import ModalBase from "./ModalBase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SettingsModal = (props: Props) => {
  return (
    <ModalBase isOpen={props.isOpen} onClose={props.onClose} label="Inställningar" icon={Cog6ToothIcon}>
      <div>
        <button>Hej!</button>
      </div>
    </ModalBase>
  );
};

export default SettingsModal;
