export interface Habit {
    id: string;
    name: string;
    dates: { month: Months; days: number[] }[];
}

export enum Months {
    JAN = 'JAN',
    FEB = 'FEB',
    MAR = 'MAR',
    APR = 'APR',
    MAY = 'MAY',
    JUN = 'JUN',
    JUL = 'JUL',
    AUG = 'AUG',
    SEP = 'SEP',
    OCT = 'OCT',
    NOV = 'NOV',
    DEC = 'DEC'
}