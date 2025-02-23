import { RadioButton } from "primereact/radiobutton";


export type SelectOptionType = "ta" | "gra" | "voc" | "coco"
export type Mark = "" | "1" | "2" | "3" | "4" | "5"
const MarkStages = [1, 2, 3, 4, 5]

export interface RadioInputProps {
    name: SelectOptionType;
    value: Mark;
    handleChange: (selected: Partial<Record<SelectOptionType, Mark>>) => void;
}

const MarkOption = ({ name, value, handleChange }: RadioInputProps) => {
    const handleOnChange = (e: any) => {
        const selectedVal = e.target.value;
        const selecteName = e.target.name
        const selected: Partial<Record<SelectOptionType, Mark>> = {};
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
                            value={num}
                            onChange={handleOnChange}
                            checked={value === num.toString()}
                        />
                        <label htmlFor={`${name}-${num}`} className="ml-2">
                            {num}
                        </label>
                    </div>
                ))}

            </div>

        </div>
    )
}

export default MarkOption;