import { useEffect, useState } from "react";
import { useTourismPlaces } from "@/hooks/use-api";
import { TOURISM_TAGS } from "@/config/constants";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "@/lib/translations";

import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Badge 
} from "@/components/ui/badge";
import {
  Button
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Tourism() {
  const { tourismPlaces, loading, error } = useTourismPlaces();
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const { language } = useLanguage();
  const t = useTranslation(language);
  
  // Update page title
  useEffect(() => {
    document.title = "Explore Ujjain | Rai Guest House";
  }, []);
  
  // Function to get the translated title
  const getTranslatedTitle = (title: string) => {
    return title === "Mahakaleshwar Temple" 
      ? t('tourism.places.mahakaleshwar.title')
      : title === "Kal Bhairav Temple" 
        ? t('tourism.places.kalbhairav.title')
        : title === "Ram Ghat" 
          ? t('tourism.places.ramghat.title')
          : title;
  };
  
  // Function to get the translated description
  const getTranslatedDescription = (title: string, description: string) => {
    return title === "Mahakaleshwar Temple" 
      ? t('tourism.places.mahakaleshwar.description')
      : title === "Kal Bhairav Temple" 
        ? t('tourism.places.kalbhairav.description')
        : title === "Ram Ghat" 
          ? t('tourism.places.ramghat.description')
          : description;
  };

  // Filter places based on selected tag
  const filteredPlaces = selectedTag === "All" 
    ? tourismPlaces 
    : tourismPlaces.filter(place => place.tags.includes(selectedTag));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('tourism.title')}</h2>
      
      {/* Filter Tags */}
      <Tabs 
        defaultValue="All" 
        value={selectedTag} 
        onValueChange={setSelectedTag}
        className="mb-8"
      >
        <TabsList className="w-full sm:w-auto flex flex-wrap">
          {TOURISM_TAGS.map(tag => (
            <TabsTrigger key={tag} value={tag}>
              {tag === "All" ? t('tourism.filter.all') : 
               tag === "Religious" ? t('tourism.filter.religious') :
               tag === "Heritage" ? t('tourism.filter.heritage') :
               tag === "Romantic" ? t('tourism.filter.romantic') :
               tag === "Educational" ? t('tourism.filter.educational') : tag}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
              Error Loading Tourism Information
            </h3>
            <p className="text-red-700 dark:text-red-400">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Tourism Places Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {t('tourism.noResults')}
              </p>
            </div>
          ) : (
            filteredPlaces.map((place) => (
              <Card key={place.id} className="overflow-hidden flex flex-col h-full">
                <CardContent className="p-6 flex-grow flex flex-col">
                  <Dialog>
                    <DialogTrigger asChild>
                      <h3 
                        className="font-bold text-xl mb-2 cursor-pointer hover:text-primary transition-colors"
                        data-place-id={place.id}
                      >
                        {getTranslatedTitle(place.title)}
                      </h3>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">{getTranslatedTitle(place.title)}</DialogTitle>
                      </DialogHeader>
                      
                      {/* Photo carousel */}
                      {place.photoLinks && place.photoLinks.length > 0 ? (
                        <div className="relative mt-4 mb-6 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                          <div className="aspect-video relative flex items-center justify-center">
                            <img 
                              src={place.photoLinks[selectedPhotoIndex]} 
                              alt={place.title} 
                              className="object-cover rounded-md max-h-[300px] w-auto"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                              }}
                            />
                            
                            {/* Photo navigation */}
                            {place.photoLinks.length > 1 && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="absolute left-2 z-10 h-8 w-8 rounded-full p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPhotoIndex(prev => 
                                      prev === 0 ? place.photoLinks!.length - 1 : prev - 1
                                    );
                                  }}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="absolute right-2 z-10 h-8 w-8 rounded-full p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPhotoIndex(prev => 
                                      prev === place.photoLinks!.length - 1 ? 0 : prev + 1
                                    );
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                
                                {/* Photo counter */}
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                                  {selectedPhotoIndex + 1} / {place.photoLinks.length}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center py-6 bg-gray-100 dark:bg-gray-800 rounded-md mb-6">
                          <img 
                            src="/fallback-logo.png" 
                            alt="Rai Guest House" 
                            className="object-cover rounded-md max-h-[200px] w-auto"
                          />
                        </div>
                      )}
                      
                      <DialogDescription className="text-base text-foreground">
                        {getTranslatedDescription(place.title, place.description)}
                      </DialogDescription>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {place.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{t('tourism.distance')}: {place.distance}</span>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => window.open(place.mapsLink, "_blank")}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          {t('tourism.viewMap')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow line-clamp-3">
                    {getTranslatedDescription(place.title, place.description)}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{t('tourism.distance')}: {place.distance}</span>
                    
                    <div className="ml-auto flex flex-wrap gap-1">
                      {place.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {place.photoLinks && place.photoLinks.length > 0 ? (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedPhotoIndex(0);
                          const dialogTrigger = document.querySelector(`[data-place-id="${place.id}"]`) as HTMLElement;
                          if (dialogTrigger) dialogTrigger.click();
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t('tourism.viewPhotos')}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const dialogTrigger = document.querySelector(`[data-place-id="${place.id}"]`) as HTMLElement;
                          if (dialogTrigger) dialogTrigger.click();
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t('tourism.viewPhotos')}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(place.mapsLink, "_blank")}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {t('tourism.viewMap')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
