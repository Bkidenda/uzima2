import { Button } from "@/components/ui/button";
import { Leaf, LogOut, ChevronDown, Home, User as UserIcon, FileEdit, Bell } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationsBell from "@/components/NotificationsBell";

const baseNav = [
  { to: "/", label: "Home", end: true, icon: Home },
  { to: "/recipes", label: "Recipes" },
  { to: "/devotions", label: "Devotions" },
  { to: "/articles", label: "Articles" },
  { to: "/videos", label: "Videos" },
];
const memberNav = [
  { to: "/communities", label: "Communities" },
  { to: "/messages", label: "Chats" },
];

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-muted-foreground hover:text-primary transition-smooth",
    isActive && "text-primary font-medium"
  );

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-primary shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          Uzima
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm ml-auto">
          {baseNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClasses}>
              {item.label}
            </NavLink>
          ))}
          {user && memberNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              {item.label}
            </NavLink>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-smooth focus:outline-none">
              About <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild><Link to="/about">About Us</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/about/vision">Vision &amp; Mission</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/about/team">Our Team</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/#contact">Contact</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user && <NotificationsBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-smooth">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold overflow-hidden">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="me" className="h-full w-full object-cover" />
                      : (profile?.username ?? "U").charAt(0).toUpperCase()}
                  </span>
                  @{profile?.username ?? "you"}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild><Link to="/dashboard"><Home className="h-4 w-4 mr-2" />Dashboard</Link></DropdownMenuItem>
                {profile?.username && (
                  <DropdownMenuItem asChild><Link to={`/u/${profile.username}`}><UserIcon className="h-4 w-4 mr-2" />View my profile</Link></DropdownMenuItem>
                )}
                <DropdownMenuItem asChild><Link to="/profile"><UserIcon className="h-4 w-4 mr-2" />Edit profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/my-materials"><FileEdit className="h-4 w-4 mr-2" />My materials</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/notifications"><Bell className="h-4 w-4 mr-2" />Notifications</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth">Join Uzima</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
