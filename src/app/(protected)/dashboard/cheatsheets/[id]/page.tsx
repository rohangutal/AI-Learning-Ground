"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCheatsheetById } from "@/lib/actions/cheatsheets";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { 
  ArrowLeft, 
  FileCode2, 
  Copy, 
  Check, 
  Search, 
  Tags, 
  Command,
  BookOpen
} from "lucide-react";
import Link from "next/link";

interface CheatsheetItem {
  title: string;
  syntax: string;
  description: string;
  example?: string;
}

interface CheatsheetSection {
  category: string;
  items: CheatsheetItem[];
}

interface CheatsheetType {
  id: string;
  title: string;
  description: string | null;
  content: {
    title: string;
    description: string;
    sections: CheatsheetSection[];
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function CheatsheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [cheatsheet, setCheatsheet] = useState<CheatsheetType | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCheatsheet() {
      try {
        const data = await getCheatsheetById(id);
        if (!data) {
          router.push("/dashboard/cheatsheets" as never);
          return;
        }
        setCheatsheet(data as unknown as CheatsheetType);
      } catch (err) {
        console.error("Failed to load cheatsheet:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCheatsheet();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!cheatsheet) return null;

  const sections: CheatsheetSection[] = cheatsheet.content?.sections || [];
  
  // Extract all unique categories
  const categories = ["All", ...sections.map(s => s.category)];

  const handleCopy = (syntax: string, itemId: string) => {
    navigator.clipboard.writeText(syntax);
    setCopiedId(itemId);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  // Filter sections and items based on search query and category tab selection
  const filteredSections = sections.map(section => {
    // If category selected and doesn't match, return section with empty items
    if (selectedCategory !== "All" && section.category !== selectedCategory) {
      return { ...section, items: [] };
    }
    
    // Filter items in this section
    const matchingItems = section.items.filter(item => {
      const matchText = `${item.title} ${item.syntax} ${item.description} ${item.example || ""}`.toLowerCase();
      return matchText.includes(searchQuery.toLowerCase());
    });

    return {
      ...section,
      items: matchingItems
    };
  }).filter(section => section.items.length > 0); // Only render sections that have matches

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" asChild className="mb-2 pl-0 hover:bg-transparent">
              <Link href={"/dashboard/cheatsheets" as never}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cheatsheets
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <FileCode2 className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                {cheatsheet.title}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl">
              {cheatsheet.description}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Control Panel: Search & Filter Categories */}
      <div className="grid gap-4 md:grid-cols-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search syntax, keywords or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-950"
          />
        </div>
        
        {/* Category quick selectors */}
        <div className="md:col-span-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-1.5 flex-nowrap">
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full shrink-0 ${selectedCategory === cat ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Cheatsheet Content */}
      {filteredSections.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed border-2">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="text-md font-semibold mb-1">No reference items match your search</h3>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            Try adjusting your query or resetting the category filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-10">
          {filteredSections.map((section, secIdx) => (
            <SlideUp key={section.category} delay={secIdx * 0.05}>
              <div className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center gap-2 border-b pb-2">
                  <Tags className="h-4.5 w-4.5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {section.category}
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                    {section.items.length} items
                  </span>
                </div>
                
                {/* Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item, itemIdx) => {
                    const uniqueItemId = `${secIdx}-${itemIdx}`;
                    const isCopied = copiedId === uniqueItemId;
                    
                    return (
                      <Card key={itemIdx} className="hover:shadow-sm border transition-shadow duration-200 bg-white dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Command className="h-3.5 w-3.5 text-indigo-400" />
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3 flex-grow flex flex-col justify-between">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>

                          {/* Code/Syntax Box */}
                          <div className="relative group/syntax rounded bg-slate-950 text-slate-100 font-mono text-[11px] p-3 pr-10 border border-slate-900 min-h-[44px] flex items-center overflow-x-auto overflow-y-hidden">
                            <code className="whitespace-pre scrollbar-none pr-2">{item.syntax}</code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                              onClick={() => handleCopy(item.syntax, uniqueItemId)}
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>

                          {/* Optional Example */}
                          {item.example && (
                            <div className="bg-slate-50 dark:bg-slate-900/40 rounded p-2 text-[10px] space-y-1 border border-slate-100 dark:border-slate-900">
                              <span className="font-bold text-slate-500 uppercase tracking-wider">Example</span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-mono whitespace-pre overflow-x-auto scrollbar-none">{item.example}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </SlideUp>
          ))}
        </div>
      )}
    </div>
  );
}
