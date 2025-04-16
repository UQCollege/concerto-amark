import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

type ConfirmDialogProps = {
  visible: boolean;
  message: string;
  onHide: () => void;
  onConfirm: () => void;
};

export default function DialogUi({ visible, message, onHide, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Confirm Deletion"
      footer={
        <div>
          <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={onHide} />
          <Button label="Delete" icon="pi pi-check" className="p-button-danger" onClick={onConfirm} />
        </div>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}
