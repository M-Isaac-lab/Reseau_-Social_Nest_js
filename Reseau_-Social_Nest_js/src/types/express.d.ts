declare namespace Express {
  interface User {
    userId: number;
    username: string;
    email: string;
    createAt: Date;
    updateAt: Date;
  }
}
