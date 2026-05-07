import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppDataProvider, type BatchEntry, type CompanyInfo, type LabReport } from "@/contexts/AppDataContext";

export interface PreloadState {
  company?: CompanyInfo | null;
  batches?: BatchEntry[];
  labReports?: LabReport[];
  onboardingComplete?: boolean;
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Initial pathname (and optional search). Default: "/" */
  route?: string;
  /** All routes the MemoryRouter should know about. If omitted, the element is rendered at `route`. */
  routes?: { path: string; element: ReactElement }[];
  /** localStorage seed; written before any provider mounts. */
  preload?: PreloadState;
}

export interface RenderWithProvidersResult extends RenderResult {
  user: UserEvent;
}

function seedLocalStorage(preload: PreloadState | undefined): void {
  if (!preload) return;
  if (preload.company !== undefined) {
    localStorage.setItem("dop_company", JSON.stringify(preload.company));
  }
  if (preload.batches !== undefined) {
    localStorage.setItem("dop_batches", JSON.stringify(preload.batches));
  }
  if (preload.labReports !== undefined) {
    localStorage.setItem("dop_labReports", JSON.stringify(preload.labReports));
  }
  if (preload.onboardingComplete !== undefined) {
    localStorage.setItem("dop_onboarded", JSON.stringify(preload.onboardingComplete));
  }
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  initialEntries: string[];
  routes?: { path: string; element: ReactElement }[];
}

function Providers({ children, initialEntries, routes }: ProvidersProps): ReactElement {
  const client = makeQueryClient();
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <LanguageProvider>
          <AppDataProvider>
            <MemoryRouter initialEntries={initialEntries}>
              {routes ? (
                <Routes>
                  {routes.map((r) => (
                    <Route key={r.path} path={r.path} element={r.element} />
                  ))}
                  <Route path="*" element={<>{children}</>} />
                </Routes>
              ) : (
                children
              )}
            </MemoryRouter>
          </AppDataProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/**
 * Renders `ui` inside the same provider stack the real app uses, with a
 * MemoryRouter so navigation can be asserted via test-only routes.
 *
 * If `routes` is supplied, the MemoryRouter renders those routes and the `ui`
 * is the catch-all. Pass test-only landing routes to assert navigation
 * (e.g. `{ path: "/home", element: <div>HOME</div> }`).
 */
export function renderWithProviders(
  ui: ReactElement,
  opts: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  const { route = "/", routes, preload, ...rtlOpts } = opts;
  seedLocalStorage(preload);
  const user = userEvent.setup({
    // Don't block on pointer events that jsdom can't fully simulate.
    pointerEventsCheck: 0,
  });
  const result = render(ui, {
    wrapper: ({ children }) => (
      <Providers initialEntries={[route]} routes={routes}>
        {children}
      </Providers>
    ),
    ...rtlOpts,
  });
  return { user, ...result };
}
