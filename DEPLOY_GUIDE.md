# Deployment Instructions

## Backend (Render)
1. Go to [Render](https://render.com).
2. Create a new **Web Service**.
3. Connect your repository.
4. Set the **Build Command** to: `pip install -r requirements.txt`
5. Set the **Start Command** to: `uvicorn app:app --host 0.0.0.0 --port $PORT`
6. Once deployed, copy the URL (e.g., `https://safety-nav-backend.onrender.com`).

## Client (Render Static Site)
1. Create a new **Static Site** on Render.
2. Connect your repository.
3. Set the **Build Command** to: `cd client && npm install && npx expo export --platform web`
4. Set the **Publish Directory** to: `client/dist`
5. **CRITICAL**: Add an Environment Variable:
   - `EXPO_PUBLIC_API_URL`: (Paste your Backend URL here)

## Alternative: Vercel (Recommended for Client)
1. Go to [Vercel](https://vercel.com).
2. Import your repository.
3. Vercel should auto-detect Expo/Next.js. If not:
   - **Build Command**: `cd client && npm install && npx expo export --platform web`
   - **Output Directory**: `client/dist`
4. Add the Environment Variable `EXPO_PUBLIC_API_URL` with your backend link.
