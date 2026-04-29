import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Recipes from "./pages/Recipes.tsx";
import Devotions from "./pages/Devotions.tsx";
import Videos from "./pages/Videos.tsx";
import Articles from "./pages/Articles.tsx";
import Compose from "./pages/Compose.tsx";
import EditPost from "./pages/EditPost.tsx";
import PostDetail from "./pages/PostDetail.tsx";
import Communities from "./pages/Communities.tsx";
import CommunityDetail from "./pages/CommunityDetail.tsx";
import Messages from "./pages/Messages.tsx";
import ChatRoom from "./pages/ChatRoom.tsx";
import Profile from "./pages/Profile.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Members from "./pages/Members.tsx";
import Notifications from "./pages/Notifications.tsx";
import MyMaterials from "./pages/MyMaterials.tsx";
import About from "./pages/About.tsx";
import VisionMissionPage from "./pages/VisionMissionPage.tsx";
import TeamPage from "./pages/TeamPage.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import NotFound from "./pages/NotFound.tsx";
import ScrollToHash from "./components/ScrollToHash.tsx";
import WhatsAppButton from "./components/WhatsAppButton.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToHash />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/u/:username" element={<UserProfile />} />
            <Route path="/members" element={<Members />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/my-materials" element={<MyMaterials />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/devotions" element={<Devotions />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/compose" element={<Compose />} />
            <Route path="/edit/:id" element={<EditPost />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<CommunityDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<ChatRoom />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/vision" element={<VisionMissionPage />} />
            <Route path="/about/team" element={<TeamPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WhatsAppButton />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
