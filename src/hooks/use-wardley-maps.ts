'use client';

import { useState, useEffect, useCallback } from 'react';
import { WardleyMap } from '@/lib/types';

const STORAGE_KEY = 'wardleyMaps';

export const useWardleyMaps = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getSavedMaps = useCallback((): WardleyMap[] => {
    if (!isClient) return [];
    try {
      const savedMapsJson = localStorage.getItem(STORAGE_KEY);
      return savedMapsJson ? JSON.parse(savedMapsJson) : [];
    } catch (error) {
      console.error('Failed to parse saved maps from localStorage', error);
      return [];
    }
  }, [isClient]);

  const saveMap = useCallback(
    (mapToSave: WardleyMap) => {
      if (!isClient) return;
      const maps = getSavedMaps();
      const existingMapIndex = maps.findIndex((m) => m.id === mapToSave.id);

      if (existingMapIndex !== -1) {
        // Update existing map
        maps[existingMapIndex] = mapToSave;
      } else {
        // Add new map with a unique ID
        maps.push({ ...mapToSave, id: mapToSave.id || `map_${Date.now()}` });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
    },
    [isClient, getSavedMaps]
  );
  
  const loadMap = useCallback(
    (id: string): WardleyMap | undefined => {
      if (!isClient) return undefined;
      const maps = getSavedMaps();
      return maps.find((m) => m.id === id);
    },
    [isClient, getSavedMaps]
  );

  const deleteMap = useCallback(
    (id: string) => {
      if (!isClient) return;
      const maps = getSavedMaps();
      const filteredMaps = maps.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMaps));
    },
    [isClient, getSavedMaps]
  );

  return { saveMap, loadMap, getSavedMaps, deleteMap };
};
