import axios from 'axios';

export interface CoingeckoResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface CoinGeckoAsset {
  id: string;
  symbol: string;
  name: string;
}

export const coingeckoService = {
  async getSupportedAssets(): Promise<CoinGeckoAsset[]> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  },

  async getHistoricalData(
    id: string,
    days: number,
    interval: string
  ): Promise<CoingeckoResponse> {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: days.toString(),
          interval,
        },
      }
    );
    return response.data;
  },

  async getAssetDetails(id: string): Promise<any> {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset details:', error);
      throw error;
    }
  },
};

export default coingeckoService;