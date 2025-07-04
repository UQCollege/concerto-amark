import { RadioButton } from "primereact/radiobutton";
import { Rating } from "../apiTypes";
import { Tooltip } from "primereact/tooltip";
import { MarkStages, MarkTips } from "../utils/data/constants";

export type SelectOptionType = "ta" | "gra" | "voc" | "coco"
export type Mark = "" | "1" | "2" | "3" | "4" | "5"

export interface RadioInputProps {
    name: SelectOptionType;
    value: Rating;
    handleChange: (selected: Partial<Record<SelectOptionType, Rating>>) => void;
}

    

const MarkOption = ({ name, value, handleChange }: RadioInputProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOnChange = (e: any) => {
        const selectedVal = e.target.value;
        const selecteName = e.target.name
        const selected: Partial<Record<SelectOptionType, Rating>> = {};
        selected[selecteName as SelectOptionType] = selectedVal;
        handleChange(selected);
    }
    return (
        <div className="flex">
            <div className="flex flex-wrap gap-3">
                {MarkStages.map((num) => (
                    <div key={num} className="flex align-items-center">
                        <RadioButton
                            inputId={`${name}-${num}`}
                            name={name}
                            value={num.toString()}
                            onChange={handleOnChange}
                            checked={Number(value) === num}
                        />
                        <Tooltip target=".label-tooltip" />
                        <label htmlFor={`${name}-${num}`} className="label-tooltip ml-2" data-pr-tooltip={MarkTips[name][num]} data-pr-position="mouse" >
                            {num}
                            
                        </label>
                    </div>
                ))}

            </div>

        </div>
    )
}

export default MarkOption;