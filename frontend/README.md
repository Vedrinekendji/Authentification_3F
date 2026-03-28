# 🔐 Projet : Authentification à 3 Facteurs (3FA)

## 📖 Description du projet

Ce projet consiste en la mise en place d’un système d’authentification sécurisé basé sur **trois facteurs de vérification**.

L’objectif est de renforcer la sécurité des comptes utilisateurs en combinant plusieurs niveaux de protection.

---

## 🔐 Principe de l’authentification 3 facteurs

Le système fonctionne en 3 étapes :

1. **Facteur 1 : Connaissance**

   * Email + mot de passe

2. **Facteur 2 : Possession**

   * Envoi d’un code de vérification par email

3. **Facteur 3 : Connaissance supplémentaire**

   * Code PIN défini par l’utilisateur

👉 L’accès au dashboard est autorisé uniquement si les 3 étapes sont validées.

---

## 🎯 Objectifs

* Sécuriser l’accès utilisateur
* Réduire les risques de piratage
* Implémenter une authentification forte
* Simuler un système réel utilisé en entreprise

---

## 🛠️ Technologies utilisées

| Technologie   | Rôle             |
| ------------- | ---------------- |
| Node.js       | Backend          |
| React.js      | Frontend         |
| MySQL (XAMPP) | Base de données  |
| Docker        | Conteneurisation |
| Git           | Versionnement    |

---

## 📂 Versionnement du projet

Le projet est versionné avec :

* Git
* Hébergé sur GitHub / GitLab

👉 Le lien du dépôt est fourni à l’encadrant.

---

## ⚙️ Prérequis

* Node.js (v18 ou +)
* MySQL (XAMPP)
* Git
* Docker (optionnel)

---

## 🔧 Installation

```bash
git clone <url-du-repo>
cd projet-3fa
npm install
```

---

## ⚙️ Configuration

Créer un fichier `.env` :

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=auth_3fa

JWT_SECRET=secret_key

EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=mot_de_passe_application
```

---

## ▶️ Lancement du projet

```bash
# Backend
npm start

# Frontend
npm run dev
```

Accès :

* Frontend : http://localhost:3000
* Backend : http://localhost:5000

---

## 🐳 Docker (Livrable obligatoire)

Utilisation de Docker Compose pour lancer l’application :

```yaml
version: "3.8"

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: auth_3fa
    ports:
      - "3306:3306"
```

### Lancer tout :

```bash
docker-compose up
```

---

## 🔐 SIEM (Sécurité et surveillance)

Le projet peut être intégré avec un outil SIEM comme :

* Wazuh
* ELK Stack

### 📊 Contenu du fichier de configuration SIEM

* Dashboards :

  * connexions utilisateurs
  * tentatives échouées

* Règles :

  * 3 échecs de login → alerte

* Alertes :

  * connexion suspecte
  * tentative brute force

---

## 🧪 Tests automatisés

### Types de tests

* Tests unitaires (fonctions)
* Tests d’intégration (login complet)

### Lancer les tests :

```bash
npm test
```

### Couverture :

```bash
npm run test --coverage
```

🎯 Objectif : **≥ 70% de couverture**

---

## 📁 Structure du projet

```
projet-3fa/
├── backend/
├── frontend/
├── tests/
├── docker-compose.yml
└── README.md
```

---

## 🔄 Fonctionnement global

1. L’utilisateur entre email + mot de passe
2. Un code est envoyé par email
3. L’utilisateur saisit le code reçu
4. Il entre son code PIN
5. Accès au dashboard

---

## 📦 Déploiement

```bash
npm run build
```

Configurer :

* variables d’environnement
* base de données

---

## 🎯 Conclusion

Ce projet respecte les exigences techniques :

✔ Code versionné avec Git
✔ README complet
✔ Docker Compose fonctionnel
✔ Intégration SIEM
✔ Tests automatisés avec couverture ≥ 70%

---
