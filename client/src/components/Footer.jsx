import { Github, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-neutral-200 py-4 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>&copy; {new Date().getFullYear()} DSA Tracker.</span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center gap-1">
                        Made with <Heart className="h-3 w-3 text-red-500 fill-current" /> by
                        <span className="font-medium text-black">Ayush Kumar Singh</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <a
                        href="https://github.com/trex-ayush"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-black transition-colors"
                    >
                        <Github className="h-4 w-4" />
                        <span>trex-ayush</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
