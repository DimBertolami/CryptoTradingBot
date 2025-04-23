export type RecentAction = {
  timestamp: number;
  action: string;
  confidence: number;
  reward: number;
};

export interface SystemStatus {
  backend: { success: boolean; message?: string };
  signals: { success: boolean; message?: string };
  paperTrading: { success: boolean; message?: string };
  database: { success: boolean; message?: string };
}

export interface DQNModel {
  episodeReward: number;
  epsilon: number;
  actionDistribution: {
    hold: number;
    buy: number;
    sell: number;
  };
  recentActions: RecentAction[];
}

export interface PriceModel {
  predictions: Array<{
    timestamp: string;
    predicted: number;
    actual: number;
  }>;
}

export interface Metrics {
  systemStatus: SystemStatus;
  dqnModel: DQNModel;
  priceModel: PriceModel;
}
