import { ArrowPathIcon } from "@heroicons/react/24/outline";

const LoadingSpinner = () => (
  <div className="flex items-center gap-2">
    <ArrowPathIcon className="h-6 min-h-6 w-6 min-w-6 motion-safe:animate-[spin_2s_linear_infinite]" />
  </div>
);

export default LoadingSpinner;
