import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import '@testing-library/jest-dom';
import OptionsEditor from '../uis/OptionsEditor';
import * as reduxHooks from '../store/hooks';

describe('OptionsEditor', () => {
  const mockRaters = [
    { raterName: 'Alice', active: true },
    { raterName: 'Bob', active: true },
    { raterName: 'Charlie', active: false },
  ];

  beforeEach(() => {
    vi.spyOn(reduxHooks, 'useAppSelector').mockReturnValue(mockRaters);
  });

  it('renders with no selection in dialog mode', () => {
    render(<OptionsEditor value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/search a rater name/i)).toBeInTheDocument();
    expect(screen.getByText(/click to select/i)).toBeInTheDocument();
  });

  it('filters dropdown options by input', () => {
    render(<OptionsEditor value="" onChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/search a rater name/i), {
      target: { value: 'al' },
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('calls onChange when dropdown changes (dialog context)', () => {
    const handleChange = vi.fn();
    render(<OptionsEditor value="" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search a rater name/i), {
      target: { value: 'bob' },
    });

    fireEvent.click(screen.getByText('Bob'));
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Bob' },
    });

    expect(handleChange).toHaveBeenCalledWith('Bob');
  });

  it('renders in table context and calls editorCallback', () => {
    const editorCallback = vi.fn();
    const rowData = { rater: 'Alice' };
    render(
      <OptionsEditor
        rowData={rowData}
        column={{ field: 'rater' }}
        editorCallback={editorCallback}
      />
    );

    fireEvent.click(screen.getByText('×')); // Clear button
    expect(editorCallback).toHaveBeenCalledWith('');
  });
});
