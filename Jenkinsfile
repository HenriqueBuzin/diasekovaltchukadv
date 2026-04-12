pipeline {
    agent any

    stages {

        stage('Deploy') {
            steps {
                script {

                    def branch = env.GIT_BRANCH.replace("origin/", "")
                    echo "Branch: ${branch}"

                    if (branch == 'main') {
                        sh '''
                        cd /root/diasekovaltchukadv

                        git fetch origin
                        git reset --hard origin/main

                        ln -sf /root/envs/.env .env

                        docker compose --profile prod up -d --build
                        '''
                    }

                    else if (branch == 'dev') {
                        sh '''
                        cd /root/diasekovaltchukadv-dev

                        git fetch origin
                        git reset --hard origin/dev

                        ln -sf /root/envs/.env.dev .env

                        docker compose --profile dev up -d --build
                        '''
                    }

                    else {
                        echo "Branch não suportada: ${branch}"
                    }
                }
            }
        }

    }
}
