import { useState, useEffect } from 'react';
import { ADSBDataSource } from '../lib/flights';

const STORAGE_KEY = 'adsb-data-source';

export function useDataSource() {
  const [dataSource, setDataSource] = useState<ADSBDataSource>(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Object.values(ADSBDataSource).includes(saved as ADSBDataSource)) {
        return saved as ADSBDataSource;
      }
    } catch (error) {
      console.warn('Failed to load data source from localStorage:', error);
    }
    return ADSBDataSource.ADSB_ONE; // Default to ADSB.One
  });

  useEffect(() => {
    // Save to localStorage whenever the data source changes
    try {
      localStorage.setItem(STORAGE_KEY, dataSource);
    } catch (error) {
      console.warn('Failed to save data source to localStorage:', error);
    }
  }, [dataSource]);

  return { dataSource, setDataSource };
}