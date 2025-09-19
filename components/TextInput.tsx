
import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const TextInput: React.FC<TextInputProps> = ({ label, id, ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-400">
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          name={id}
          className="block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
          {...props}
        />
      </div>
    </div>
  );
};

export default TextInput;
