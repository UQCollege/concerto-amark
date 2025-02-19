import React, { ReactNode } from "react";

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

const Button = ({ onClick, children, className }: ButtonProps) => {
  return (
    <button
      className={`border rounded-xl hover:bg-indigo-50 hover:text-black p-2 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
