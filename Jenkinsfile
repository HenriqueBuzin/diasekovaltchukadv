pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    stages {

        stage('Deploy') {
            steps {
                script {

                    def branch = env.BRANCH_NAME
                    def project = "diasekovaltchuk-adv"

                    echo "🚀 Branch: ${branch}"

                    if (branch == 'main') {
                        sh """
                        set -e

                        cd /root/projects/${project}

                        echo "🔄 Atualizando código..."
                        git fetch origin
                        git reset --hard origin/main
                        git clean -fd

                        echo "🔗 Aplicando .env..."
                        ln -sf /root/projects/envs/${project}.env .env

                        echo "🛑 Derrubando containers antigos..."
                        docker compose --profile prod down || true

                        echo "🐳 Subindo produção..."
                        docker compose --profile prod up -d --build

                        echo "📋 Status dos containers..."
                        docker compose --profile prod ps

                        echo "✅ Deploy de produção concluído."
                        """
                    }

                    else if (branch == 'dev') {
                        sh """
                        set -e

                        cd /root/projects/${project}-dev

                        echo "🔄 Atualizando código..."
                        git fetch origin
                        git reset --hard origin/dev
                        git clean -fd

                        echo "🔗 Aplicando .env..."
                        ln -sf /root/projects/envs/${project}-dev.env .env

                        echo "🛑 Derrubando containers antigos..."
                        docker compose --profile dev down || true

                        echo "🐳 Subindo desenvolvimento..."
                        docker compose --profile dev up -d --build

                        echo "📋 Status dos containers..."
                        docker compose --profile dev ps

                        echo "✅ Deploy de desenvolvimento concluído."
                        """
                    }

                    else {
                        echo "⚠️ Branch ignorada: ${branch}"
                    }
                }
            }
        }

    }
}