import express, { Request, Response } from 'express';

const app = express();
const PORT = 8082;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
	res.send('Hello, ditto');
});

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
