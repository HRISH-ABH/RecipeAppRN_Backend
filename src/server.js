import express from "express";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTables } from "./db/schema.js";
import { and, eq } from "drizzle-orm";
import job from "./config/cron.js";

const app = express();
app.use(express.json());
const PORT = ENV.PORT || 3000;

if (ENV.NODE_ENV === "production") job.start();

app.get("/health", (req, res) => {
  res.json({
    message: "Server running just fine!!!",
  });
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;
    if (!userId || !recipeId || !title) {
      return res.status(400).json({ error: "Missing required fields!!" });
    }

    const newFav = await db
      .insert(favoritesTables)
      .values({
        userId,
        recipeId,
        title,
        image,
        cookTime,
        servings,
      })
      .returning();

    res.status(201).json(newFav);
  } catch (e) {
    console.log("Error adding fav", e);
    res.status(500).json({ error: "Something went wrong!!!" });
  }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    await db
      .delete(favoritesTables)
      .where(
        and(
          eq(favoritesTables.userId, userId),
          eq(favoritesTables.recipeId, parseInt(recipeId))
        )
      );
    res.status(200).json({ message: "Favorite removed successfully!!" });
  } catch (e) {
    console.log("Error adding fav", e);
    res.status(500).json({ error: "Unable to delete at the moment!!!" });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userFavorites = await db
      .select()
      .from(favoritesTables)
      .where(eq(favoritesTables.userId, userId));
    res.json({
      total_favorites: userFavorites.length,
      userFavorites,
    });
  } catch (e) {
    console.log("Error fetching favorites!!", e);
    res.status(500).json({ error: "Error catching favorites" });
  }
});
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
