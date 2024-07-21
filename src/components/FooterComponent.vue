<template>
    <footer>
        <p>
            2024 &copy; ogle. All rights reserved.
            Data & Images provided by: <a href="https://rawg.io/">RAWG</a>
        </p>
    </footer>
</template>

<style scoped>
    footer {
        margin-top: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 6rem;

        background-color: var(--secondary-color);
        box-shadow: 0 10px 20px 0 rgba(0,0,0,.07);
    }
    p { 
        text-align: center;
        font-style: italic;
    }
    a {
        color: var(--accent);
        text-decoration: none;
    }
</style>