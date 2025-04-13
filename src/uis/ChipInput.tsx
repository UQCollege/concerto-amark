import React, { ChangeEvent, KeyboardEvent, useRef } from 'react';
import { Chip } from 'primereact/chip';
import { InputText } from 'primereact/inputtext';

interface ChipInputProps {
    chips: string[];
    setChips: React.Dispatch<React.SetStateAction<string[]>>;
}

const ChipInput: React.FC<ChipInputProps> = ({ chips, setChips }) => {
    const [inputValue, setInputValue] = React.useState<string>('');

    // Handle input change
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setInputValue(e.target.value);
    };

    // Handle key down event to detect comma or delete key press
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === ',') {
            // Prevent default behavior for comma
            e.preventDefault();

            // Add chip if there is a value in the input
            if (inputValue.trim() !== '') {
                setChips((prevChips) => [...prevChips, inputValue.trim()]);
                setInputValue('');  // Clear input after adding chip
            }
        }
        // Handle delete key to remove the last chip
        else if (e.key === 'Backspace' && inputValue === '') {
            setChips((prevChips) => prevChips.slice(0, -1)); // Remove last chip
        }
    };

    return (
        <div className="input-chip-container">
            <div className="chips-wrapper bg-white">
                {chips.map((chip, index) => (
                    <Chip key={index} label={chip} className="chip-inside-input" />
                ))}
                <InputText
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Example: s000, s001, s002,"
                    className="chip-input-field border-0"
                />
            </div>
        </div>
    );
};

export default ChipInput;
