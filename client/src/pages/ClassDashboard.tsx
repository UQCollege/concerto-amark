import { useParams } from "react-router";
import { getClassWritings } from "../utils/apiService";
import { downloadWritingsZip } from "../utils/downloadPDF";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";

const ClassDashboard = () => {

    const { name } = useParams<{ name: string | undefined }>();
    if (!name) return <h1>Unknown User</h1>


    const handleClassWritings = async (name: string) => {
        const pdfData = await getClassWritings(name);
        downloadWritingsZip(pdfData)
    }
    return (
        <>
            <Panel header={`${name}'s Class Dashboard`} className="m-5 w-[60vw]">

                <div className="flex gap-2 m-5">

                    <Button label="Download Class Tasks" onClick={async () => handleClassWritings(name)} />
                </div>
            </Panel>
        </>
    );
}

export default ClassDashboard;