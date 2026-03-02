import { createContext, ReactNode, useContext, useState } from "react";
import BigActivityIndicator from "./BigActivityIndicator";

type ActivityOptions = {
  message?: string;
};

type ActivityContextType = {
  showActivity: (options: ActivityOptions) => Promise<boolean>;
  hideActivity: () => void;
};

const BigActivityIndicatorContext = createContext<ActivityContextType | undefined>(undefined);

export const BigActivityIndicatorProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ActivityOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const showActivity = (options: ActivityOptions): Promise<boolean> => {
    setOptions(options);
    setVisible(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const hideActivity = () => {
    setVisible(false);
    resolver?.(false);
  };

  return (
    <BigActivityIndicatorContext.Provider value={{ showActivity, hideActivity }}>
      {children}
      {visible && <BigActivityIndicator text={options?.message} />}
    </BigActivityIndicatorContext.Provider>
  )
}

export const useBigActivityIndicator = () => {
  const context = useContext(BigActivityIndicatorContext);
  if (!context) throw new Error('useBigActivityIndicator must be used within a BigActivityIndicatorProvider');
  return context;
}