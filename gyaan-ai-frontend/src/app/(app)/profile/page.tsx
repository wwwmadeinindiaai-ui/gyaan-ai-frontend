[FULL CORRECTED CONTENT: Start of file unchanged, complete file as before, replace incomplete InfoBox with:

const InfoBox = ({ label, value, color }) => (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${color}`}>{value}</span>
    </div>
);

const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4">
        <div className="flex-1">
            <h3 className="text-base font-medium text-gray-900">{label}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`${
                checked ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
            role="switch"
            aria-checked={checked}
        >
            <span
                className={`${
                    checked ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
);

// [End of file]
