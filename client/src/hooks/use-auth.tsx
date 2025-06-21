import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  QueryFunction,
  UseQueryResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, Student, Teacher } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type UserWithoutPassword = Omit<User, "password"> & {
  fullName?: string;
};

type AuthContextType = {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserWithoutPassword, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserWithoutPassword, Error, RegisterData>;
};

const loginSchema = z.object({
  username: z.string().min(1, "Имя пользователя является обязательным"),
  password: z.string().min(1, "Пароль является обязательным"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Подтверждение пароля является обязательным"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithoutPassword | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async ({ signal }) => {
      const baseUser = await getQueryFn({ on401: "returnNull" })({ 
        queryKey: ["/api/user"], 
        signal, 
        meta: undefined 
      }) as UserWithoutPassword | null;
      
      if (!baseUser) return null;

      // Fetch full name based on role
      // if (baseUser.role === "student" || baseUser.role === "teacher") {
      //   console.log(baseUser)
      //   const profileRes = await apiRequest("GET", `/api/${baseUser.role}/profile`);
      //   const profile = await profileRes.json() as { fullName: string };
      //   return { ...baseUser, fullName: profile.fullName };
      // }
      
      return baseUser;
    },
  });

  const loginMutation = useMutation<UserWithoutPassword, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      return await apiRequest("POST", "/api/login", credentials) as UserWithoutPassword;
    },
    onSuccess: (user: UserWithoutPassword) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Вход в систему выполнен успешно",
        description: `Добро пожаловать, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Вход в систему не выполнен",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = credentials;
      return await apiRequest("POST", "/api/register", userData);
    },
    onSuccess: (user: UserWithoutPassword) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Регистрация выполнена успешно",
        description: `Добро пожаловать, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Регистрация не выполнена",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Выход из системы выполнен успешно",
        description: "Вы успешно вышли из системы.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Выход из системы не выполнен",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться в AuthProvider");
  }
  return context;
}
