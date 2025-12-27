import React, { useState, useEffect } from 'react';


const isVisible = (condition, formData) => {
    if (!condition || Object.keys(condition).length === 0) return true;

    const { type, field_name, value } = condition;
    const parentValue = formData[field_name];

    if (type === 'ANY') {
        return value.includes(parentValue);
    }
    return true;
};

const getInitialValues = (fields) => {
    const initialData = {};
    fields.forEach(field => {
        if (field.component === 'group') {
            if (field.addMore) {
                initialData[field.name] = field.default || [];
            } else {
                // Initialize with one item if it's a static group, recursively getting defaults for children
                const childDefaults = getInitialValues(field.childComponents);
                initialData[field.name] = [childDefaults];
            }
        } else {
            if (field.default && field.default.length > 0) {
                if (field.component === 'single_select' || field.component === 'radio_button_boolean') {
                    initialData[field.name] = field.default[0];
                } else {
                    initialData[field.name] = field.default;
                }
            } else {
                initialData[field.name] = "";
            }
        }
    });
    return initialData;
};

const DynamicForm = ({ schema, onSubmit }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (schema && schema.data) {
            setFormData(getInitialValues(schema.data));
        }
    }, [schema]);

    const handleChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleGroupChange = (groupName, index, fieldName, value) => {
        setFormData(prev => {
            const newGroup = [...(prev[groupName] || [])];
            if (!newGroup[index]) newGroup[index] = {};
            newGroup[index] = { ...newGroup[index], [fieldName]: value };
            return { ...prev, [groupName]: newGroup };
        });
    };

    const addGroupItem = (groupName, childComponents) => {
        const newItem = getInitialValues(childComponents);
        setFormData(prev => ({
            ...prev,
            [groupName]: [...(prev[groupName] || []), newItem]
        }));
    };

    const removeGroupItem = (groupName, index) => {
        setFormData(prev => ({
            ...prev,
            [groupName]: prev[groupName].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = () => {
        console.log(formData);
        if (onSubmit) onSubmit(formData);
    };

    const renderField = (field, isGroupChild = false, groupIndex = null, groupName = null) => {
        let val = "";
        if (isGroupChild) {
            val = formData[groupName]?.[groupIndex]?.[field.name] || "";
        } else {
            val = formData[field.name];
        }

        // Visibility Check
        if (!isVisible(field.condition, formData)) return null;

        const commonProps = {
            key: field.name + (isGroupChild ? groupIndex : ''),
            className: "mb-4",
        };

        const label = (
            <label className="block text-gray-300 text-sm font-bold mb-2">
                {field.name} {field.required ? <span className="text-red-500">*</span> : ''}
            </label>
        );

        const inputClass = "appearance-none border border-gray-700 rounded w-full py-3 px-3 text-gray-100 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500";

        const onChange = (e) => {
            const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            if (isGroupChild) {
                handleGroupChange(groupName, groupIndex, field.name, v);
            } else {
                handleChange(field.name, v);
            }
        };

        switch (field.component) {
            case 'textbox_string':
            case 'textbox_mobile':
            case 'textbox_double':
                return (
                    <div {...commonProps}>
                        {label}
                        <input
                            type={field.component === 'textbox_string' ? 'text' : 'number'}
                            className={inputClass}
                            placeholder={field.placeholder}
                            value={val}
                            onChange={onChange}
                        />
                    </div>
                );

            case 'single_select':
            case 'multi_select_db':
                return (
                    <div {...commonProps}>
                        {label}
                        <div className="relative">
                            <select
                                className={`${inputClass} appearance-none`}
                                value={val}
                                onChange={onChange}
                            >
                                <option value="" disabled>{field.placeholder || "Select"}</option>
                                {field.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-100">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                );

            case 'radio_button_boolean':
                return (
                    <div {...commonProps}>
                        {label}
                        <div className="flex gap-4">
                            {field.options?.map(opt => {
                                let activeClass = 'border-gray-700 text-gray-400';
                                const isSelected = val === opt;
                                if (isSelected) {
                                    if (opt === 'Yes') activeClass = 'border-green-500 text-green-500 bg-green-500/10';
                                    else if (opt === 'No') activeClass = 'border-red-500 text-red-500 bg-red-500/10';
                                    else activeClass = 'border-blue-500 text-blue-500 bg-blue-500/10';
                                }

                                return (
                                    <label key={opt} className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${activeClass}`}>
                                        <input
                                            type="radio"
                                            name={field.name + (isGroupChild ? groupIndex : '')}
                                            value={opt}
                                            checked={isSelected}
                                            onChange={onChange}
                                            className="hidden"
                                        />
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? (opt === 'Yes' ? 'border-green-500' : 'border-red-500') : 'border-gray-500'}`}>
                                            {isSelected && <div className={`w-2 h-2 rounded-full ${opt === 'Yes' ? 'bg-green-500' : 'bg-red-500'}`} />}
                                        </div>
                                        <span className="font-medium">{opt}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                );

            case 'group':
                const groupItems = formData[field.name] || [];
                return (
                    <div key={field.name} className="mb-6 p-4 border border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">{field.name}</h3>

                        {groupItems.map((item, idx) => (
                            <div key={idx} className="mb-6 pb-4 border-b border-gray-800 last:border-0">
                                {field.addMore && <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-sm">#{idx + 1}</span>
                                    <button type="button" onClick={() => removeGroupItem(field.name, idx)} className="text-red-400 text-sm">Remove</button>
                                </div>}

                                {field.childComponents.map(child => renderField(child, true, idx, field.name))}
                            </div>
                        ))}

                        {field.addMore && (
                            <button
                                type="button"
                                onClick={() => addGroupItem(field.name, field.childComponents)}
                                className="w-full py-3 border border-dashed border-gray-600 text-green-500 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                            >
                                + Add Another {field.name}
                            </button>
                        )}
                    </div>
                );

            case 'attachment_camera':
                return (
                    <div {...commonProps}>
                        {label}
                        <button type="button" className="w-full py-8 border-2 border-dashed border-green-500/50 rounded-lg text-green-500 flex flex-col items-center justify-center bg-gray-800/50 hover:bg-gray-800 transition-colors">
                            <span className="mb-2 text-2xl">📷</span>
                            {field.placeholder}
                        </button>
                    </div>
                )

            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-gray-900 min-h-screen text-gray-100 font-sans">
            <div className="bg-gray-900 p-4 sticky top-0 z-10 border-b border-gray-800 flex justify-between items-center">
                <h1 className="text-xl font-bold">Tag an Outlet</h1>
            </div>

            <div className="p-4 pb-24">
                {schema?.data ? schema.data.map(field => renderField(field, false)) : <p>Loading...</p>}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 max-w-md mx-auto">
                <button
                    onClick={handleSubmit}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit
                </button>
            </div>
        </div>
    );
};

export default DynamicForm;