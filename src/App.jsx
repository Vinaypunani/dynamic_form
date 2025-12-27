import React from 'react';
import DynamicForm from './components/DynamicForm';
import inputSchema from './schema/input.json';

const App = () => {
  const handleFormSubmit = (data) => {
    console.log('Form Output:', data);
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <DynamicForm schema={inputSchema} onSubmit={handleFormSubmit} />
    </div>
  );
};

export default App;