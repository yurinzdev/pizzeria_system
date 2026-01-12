-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomNumber" TEXT,
    "name" TEXT NOT NULL,
    "allergies" TEXT,
    "notes" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisit" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE'
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "allergens" TEXT,
    "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
    "prepTime" INTEGER NOT NULL DEFAULT 15
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestId" TEXT,
    "guestName" TEXT NOT NULL,
    "tableId" TEXT,
    "time" DATETIME NOT NULL,
    "partySize" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderDetails" TEXT,
    "specialRequests" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_roomNumber_key" ON "Guest"("roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Table_number_key" ON "Table"("number");
