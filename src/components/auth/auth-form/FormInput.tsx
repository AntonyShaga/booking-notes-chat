import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormRegister } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";

interface FormInputProps {
  id: "email" | "password";
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  register: UseFormRegister<{ email: string; password: string }>;
}

export function FormInput({
  id,
  label,
  type = "text",
  placeholder,
  error,
  register,
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...register(id)}
        id={id}
        type={type}
        placeholder={placeholder}
        required
        className={error ? "border-red-500" : ""}
      />

      <div className="min-h-[2.5rem] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
